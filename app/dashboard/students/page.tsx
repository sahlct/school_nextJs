"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { studentsAPI, type Student } from "@/lib/api"
import { useAppSelector } from "@/lib/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Eye, Download, Upload } from "lucide-react"
import { StudentModal } from "@/components/students/student-modal"
import { StudentDetailModal } from "@/components/students/student-detail-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.isAdmin || false

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students", debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => studentsAPI.getAll(currentPage, pageSize, debouncedSearchTerm),
  })

  const deleteMutation = useMutation({
    mutationFn: studentsAPI.delete,
    onMutate: async (studentId: number) => {
      await queryClient.cancelQueries({ queryKey: ["students", debouncedSearchTerm, currentPage, pageSize] })
      const previousStudents = queryClient.getQueryData<{ students: Student[] }>([
        "students",
        debouncedSearchTerm,
        currentPage,
        pageSize,
      ])
      queryClient.setQueryData(
        ["students", debouncedSearchTerm, currentPage, pageSize],
        (old: { students: Student[] } | undefined) => {
          if (!old) return { students: [] }
          return {
            ...old,
            students: old.students.filter((student) => student.m03_id !== studentId),
          }
        }
      )
      return { previousStudents }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["students", debouncedSearchTerm, currentPage, pageSize] })
      toast.success("Student deleted successfully")
      setDeletingStudent(null)
    },
    onError: (error: Error, _studentId, context: any) => {
      queryClient.setQueryData(["students", debouncedSearchTerm, currentPage, pageSize], context.previousStudents)
      toast.error(error.message || "Failed to delete student")
      setDeletingStudent(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["students", debouncedSearchTerm, currentPage, pageSize] })
    },
  })

  const exportMutation = useMutation({
    mutationFn: studentsAPI.export,
    onMutate: () => {
      const toastId = toast.loading("Exporting students...")
      return { toastId }
    },
    onSuccess: (_data, _variables, context) => {
      toast.dismiss(context.toastId)
      toast.success("Students exported successfully")
    },
    onError: (error: Error, _variables, context) => {
      toast.dismiss(context.toastId)
      toast.error(error.message || "Failed to export students")
    },
  })

  const importMutation = useMutation({
    mutationFn: studentsAPI.import,
    onMutate: (file: File) => {
      const toastId = toast.loading(`Importing ${file.name}...`)
      return { toastId }
    },
    onSuccess: (data, _variables, context) => {
      toast.dismiss(context.toastId)
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success(`Imported ${data.data.createdCount} students successfully`)
      if (data.data.errors) {
        data.data.errors.forEach((error: string) => toast.error(error))
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    onError: (error: Error, _variables, context) => {
      toast.dismiss(context.toastId)
      toast.error(error.message || "Failed to import students")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      importMutation.mutate(file)
    }
  }

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      deleteMutation.mutate(deletingStudent.m03_id)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "m03_profile_photo",
      header: "Photo",
      cell: ({ row }) => (
        <Avatar className="h-10 w-10">
          <AvatarImage src={row.original.m03_profile_photo || ""} alt={row.original.m03_name} />
          <AvatarFallback>{row.original.m03_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "m03_name",
      header: "Name",
    },
    {
      accessorKey: "m03_email",
      header: "Email",
    },
    {
      accessorKey: "m03_contact_number",
      header: "Contact",
    },
    {
      accessorKey: "m03_gender",
      header: "Gender",
      cell: ({ row }) => {
        const gender = row.original.m03_gender
        return gender ? (
          <Badge variant={gender === "Male" ? "default" : gender === "Female" ? "secondary" : "outline"}>
            {gender}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "m03_enrollment_date",
      header: "Enrolled",
      cell: ({ row }) => new Date(row.original.m03_enrollment_date).toLocaleDateString(),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
              const student = row.original
              return (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewingStudent(student)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingStudent(student)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingStudent(student)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Students</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage your student records" : "View student records"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap-reverse">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full md:w-[250px]"
            />
          </div>
          {isAdmin && (
            <>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
              <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({studentsData?.pagination.total || 0})</CardTitle>
          <CardDescription>
            {isAdmin ? "A list of all students in your school" : "View all students in your school"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={studentsData?.students || []}
            loading={isLoading}
            onRowClick={(student) => setViewingStudent(student)}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={studentsData?.pagination.totalPages || 1}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <StudentModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} student={null} />
          <StudentModal
            open={!!editingStudent}
            onOpenChange={(open) => !open && setEditingStudent(null)}
            student={editingStudent}
          />
        </>
      )}

      <StudentDetailModal
        open={!!viewingStudent}
        onOpenChange={(open) => !open && setViewingStudent(null)}
        student={viewingStudent}
      />

      <ConfirmationModal
        open={!!deletingStudent}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        title="Delete Student"
        description={`Are you sure you want to delete ${deletingStudent?.m03_name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}