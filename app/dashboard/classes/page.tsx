"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { classesAPI, type Class } from "@/lib/api"
import { useAppSelector } from "@/lib/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { ClassModal } from "@/components/classes/class-modal"
import { ClassDetailModal } from "@/components/classes/class-detail-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [viewingClass, setViewingClass] = useState<Class | null>(null)
  const [deletingClass, setDeletingClass] = useState<Class | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Get current user to check admin status
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.isAdmin || false

  const { data: classesData, isLoading } = useQuery({
    queryKey: ["classes", debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => classesAPI.getAll(currentPage, pageSize, debouncedSearchTerm),
  })

  const deleteMutation = useMutation({
    mutationFn: classesAPI.delete,
    onMutate: async (classId: number) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["classes", debouncedSearchTerm, currentPage, pageSize] })

      // Snapshot the previous value
      const previousClasses = queryClient.getQueryData<{ classes: Class[] }>([
        "classes",
        debouncedSearchTerm,
        currentPage,
        pageSize,
      ])

      // Optimistically update the cache
      queryClient.setQueryData(
        ["classes", debouncedSearchTerm, currentPage, pageSize],
        (old: { classes: Class[] } | undefined) => {
          if (!old) return { classes: [] }
          return {
            ...old,
            classes: old.classes.filter((classItem) => classItem.m02_id !== classId),
          }
        }
      )

      // Return context with previous value for rollback on error
      return { previousClasses }
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["classes", debouncedSearchTerm, currentPage, pageSize] })
      toast.success("Class deleted successfully")
      setDeletingClass(null)
    },
    onError: (error: Error, _classId, context: any) => {
      // Rollback to previous state on error
      queryClient.setQueryData(["classes", debouncedSearchTerm, currentPage, pageSize], context.previousClasses)
      toast.error(error.message || "Failed to delete class")
      setDeletingClass(null)
    },
    onSettled: () => {
      // Ensure queries are refetched after mutation settles
      queryClient.invalidateQueries({ queryKey: ["classes", debouncedSearchTerm, currentPage, pageSize] })
    },
  })

  const handleDeleteConfirm = () => {
    if (deletingClass) {
      deleteMutation.mutate(deletingClass.m02_id)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: "m02_name",
      header: "Class Name",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-medium text-nowrap">
          {row.getValue("m02_name")}
        </Badge>
      ),
    },
    {
      accessorKey: "m02_subject",
      header: "Subject",
    },
    {
      accessorKey: "m02_year",
      header: "Year",
      cell: ({ row }) => <Badge variant="secondary">{row.getValue("m02_year")}</Badge>,
    },
    {
      accessorKey: "m02_m01_teacher",
      header: "Teacher",
      cell: ({ row }) => row.original.m02_m01_teacher.m01_name,
    },
    {
      accessorKey: "m02_m03_students",
      header: "Students",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-nowrap">
          {row.original.m02_m03_students.length} students
        </Badge>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
              const classItem = row.original
              return (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewingClass(classItem)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingClass(classItem)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingClass(classItem)
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
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Classes</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage your class schedules and assignments" : "View class schedules and assignments"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap-reverse">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full md:w-[300px]"
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Classes ({classesData?.pagination.total || 0})</CardTitle>
          <CardDescription>
            {isAdmin ? "A list of all classes in your school" : "View all classes in your school"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={classesData?.classes || []}
            loading={isLoading}
            onRowClick={(classItem) => setViewingClass(classItem)}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={classesData?.pagination.totalPages || 1}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <ClassModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} classItem={null} />
          <ClassModal
            open={!!editingClass}
            onOpenChange={(open) => !open && setEditingClass(null)}
            classItem={editingClass}
          />
        </>
      )}

      <ClassDetailModal
        open={!!viewingClass}
        onOpenChange={(open) => !open && setViewingClass(null)}
        classItem={viewingClass}
      />

      <ConfirmationModal
        open={!!deletingClass}
        onOpenChange={(open) => !open && setDeletingClass(null)}
        title="Delete Class"
        description={`Are you sure you want to delete ${deletingClass?.m02_name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}