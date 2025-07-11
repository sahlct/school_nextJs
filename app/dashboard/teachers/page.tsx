"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { teachersAPI, type Teacher } from "@/lib/api"
import { useAppSelector } from "@/lib/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { TeacherModal } from "@/components/teachers/teacher-modal"
import { TeacherDetailModal } from "@/components/teachers/teacher-detail-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null)
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null)
  const queryClient = useQueryClient()

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Get current user to check admin status
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.isAdmin || false

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ["teachers", debouncedSearchTerm],
    queryFn: () => teachersAPI.getAll(1, 10, debouncedSearchTerm),
  })

  const deleteMutation = useMutation({
    mutationFn: teachersAPI.delete,
    onMutate: async (teacherId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["teachers", debouncedSearchTerm] })

      // Snapshot the previous value
      const previousTeachers = queryClient.getQueryData<{ teachers: Teacher[] }>([
        "teachers",
        debouncedSearchTerm,
      ])

      // Optimistically update the cache
      queryClient.setQueryData(["teachers", debouncedSearchTerm], (old: { teachers: Teacher[] } | undefined) => {
        if (!old) return { teachers: [] }
        return {
          ...old,
          teachers: old.teachers.filter((teacher) => teacher.m01_id !== teacherId),
        }
      })

      // Return context with previous value for rollback on error
      return { previousTeachers }
    },
    onSuccess: () => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      queryClient.invalidateQueries({ queryKey: ["teachers", debouncedSearchTerm] })
      toast.success("Teacher deleted successfully")
      setDeletingTeacher(null)
    },
    onError: (error: Error, _teacherId, context: any) => {
      // Rollback to previous state on error
      queryClient.setQueryData(["teachers", debouncedSearchTerm], context.previousTeachers)
      toast.error(error.message || "Failed to delete teacher")
      setDeletingTeacher(null)
    },
    onSettled: () => {
      // Ensure queries are refetched after mutation settles
      queryClient.invalidateQueries({ queryKey: ["teachers", debouncedSearchTerm] })
    },
  })

  const teachers = teachersData?.teachers || []

  const handleDeleteConfirm = () => {
    if (deletingTeacher) {
      deleteMutation.mutate(deletingTeacher.m01_id)
    }
  }

  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "m01_profile_photo",
      header: "Photo",
      cell: ({ row }) => (
        <Avatar className="h-10 w-10">
          <AvatarImage src={row.original.m01_profile_photo || ""} alt={row.original.m01_name} />
          <AvatarFallback>{row.original.m01_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "m01_name",
      header: "Name",
    },
    {
      accessorKey: "m01_email",
      header: "Email",
    },
    {
      accessorKey: "m01_contact_number",
      header: "Contact",
    },
    {
      accessorKey: "m01_is_admin",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.m01_is_admin ? "default" : "secondary"}>
          {row.original.m01_is_admin ? "Admin" : "Teacher"}
        </Badge>
      ),
    },
    {
      accessorKey: "m01_classes",
      header: "Classes",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.m01_classes.length} {row.original.m01_classes.length === 1 ? "class" : "classes"}
        </Badge>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions" as const,
            header: "Actions",
            cell: ({ row }: { row: any }) => {
              const teacher = row.original
              return (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewingTeacher(teacher)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTeacher(teacher)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingTeacher(teacher)
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
          <h1 className="lg:text-3xl text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">{isAdmin ? "Manage your teaching staff" : "View teaching staff"}</p>
        </div>
        <div className="flex items-center flex-wrap-reverse gap-2 justify-start">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 md:w-[300px] w-full"
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teachers ({teachers.length})</CardTitle>
          <CardDescription>
            {isAdmin ? "A list of all teachers in your school" : "View all teachers in your school"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={teachers}
            loading={isLoading}
            onRowClick={(teacher) => setViewingTeacher(teacher)}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <TeacherModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} teacher={null} />
          <TeacherModal
            open={!!editingTeacher}
            onOpenChange={(open) => !open && setEditingTeacher(null)}
            teacher={editingTeacher}
          />
        </>
      )}

      <TeacherDetailModal
        open={!!viewingTeacher}
        onOpenChange={(open) => !open && setViewingTeacher(null)}
        teacher={viewingTeacher}
      />

      <ConfirmationModal
        open={!!deletingTeacher}
        onOpenChange={(open) => !open && setDeletingTeacher(null)}
        title="Delete Teacher"
        description={`Are you sure you want to delete ${deletingTeacher?.m01_name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}