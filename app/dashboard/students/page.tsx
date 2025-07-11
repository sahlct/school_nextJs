"use client"

import { useState } from "react"
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
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
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
  const queryClient = useQueryClient()

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Get current user to check admin status
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.isAdmin || false

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students", debouncedSearchTerm],
    queryFn: () => studentsAPI.getAll(1, 10, debouncedSearchTerm),
  })

  const deleteMutation = useMutation({
    mutationFn: studentsAPI.delete,
    onMutate: async (studentId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["students", debouncedSearchTerm] })

      // Snapshot the previous value
      const previousStudents = queryClient.getQueryData<{ students: Student[] }>([
        "students",
        debouncedSearchTerm,
      ])

      // Optimistically update the cache
      queryClient.setQueryData(["students", debouncedSearchTerm], (old: { students: Student[] } | undefined) => {
        if (!old) return { students: [] }
        return {
          ...old,
          students: old.students.filter((student) => student.m03_id !== studentId),
        }
      })

      // Return context with previous value for rollback on error
      return { previousStudents }
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["students", debouncedSearchTerm] })
      toast.success("Student deleted successfully")
      setDeletingStudent(null)
    },
    onError: (error: Error, _studentId, context: any) => {
      // Rollback to previous state on error
      queryClient.setQueryData(["students", debouncedSearchTerm], context.previousStudents)
      toast.error(error.message || "Failed to delete student")
      setDeletingStudent(null)
    },
    onSettled: () => {
      // Ensure queries are refetched after mutation settles
      queryClient.invalidateQueries({ queryKey: ["students", debouncedSearchTerm] })
    },
  })

  const students = studentsData?.students || []

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      deleteMutation.mutate(deletingStudent.m03_id)
    }
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
            id: "actions" as const,
            header: "Actions",
            cell: ({ row }: { row: any }) => {
              const student = row.original
              return (
                <div className="flex items ations-column">
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
          <h1 className="lg:text-3xl text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage your student records" : "View student records"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap-reverse">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 md:w-[300px] w-full"
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({students.length})</CardTitle>
          <CardDescription>
            {isAdmin ? "A list of all students in your school" : "View all students in your school"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            loading={isLoading}
            onRowClick={(student) => setViewingStudent(student)}
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