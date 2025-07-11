"use client"

import { useQuery } from "@tanstack/react-query"
import { teachersAPI, type Teacher } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Phone, Calendar, User, BookOpen } from "lucide-react"

interface TeacherDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: Teacher | null
}

export function TeacherDetailModal({ open, onOpenChange, teacher }: TeacherDetailModalProps) {
  // Fetch detailed teacher data when modal opens
  const { data: detailedTeacher, isLoading } = useQuery({
    queryKey: ["teacher", teacher?.m01_id],
    queryFn: () => teachersAPI.getById(teacher!.m01_id),
    enabled: open && !!teacher,
  })

  const teacherData = detailedTeacher || teacher

  if (!teacherData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={teacherData.m01_profile_photo || ""} alt={teacherData.m01_name} />
              <AvatarFallback>{teacherData.m01_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{teacherData.m01_name}</h3>
              <Badge variant={teacherData.m01_is_admin ? "default" : "secondary"}>
                {teacherData.m01_is_admin ? "Admin" : "Teacher"}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>Teacher Details</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{teacherData.m01_email}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{teacherData.m01_contact_number}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Joined: {new Date(teacherData.m01_created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last Updated: {new Date(teacherData.m01_updated_at).toLocaleDateString()}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Assigned Classes ({teacherData.m01_classes.length})
              </h4>
              {teacherData.m01_classes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teacherData.m01_classes.map((classItem) => (
                    <Badge key={classItem.m02_id} variant="outline">
                      {classItem.m02_name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No classes assigned</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Account Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="ml-2 font-mono">#{teacherData.m01_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant={teacherData.m01_is_admin ? "default" : "secondary"} className="ml-2">
                    {teacherData.m01_is_admin ? "Administrator" : "Teacher"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
