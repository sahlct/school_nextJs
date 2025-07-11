"use client"

import { useQuery } from "@tanstack/react-query"
import { classesAPI, type Class } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Calendar, User, GraduationCap } from "lucide-react"

interface ClassDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classItem: Class | null
}

export function ClassDetailModal({ open, onOpenChange, classItem }: ClassDetailModalProps) {
  // Fetch detailed class data when modal opens
  const { data: detailedClass, isLoading } = useQuery({
    queryKey: ["class", classItem?.m02_id],
    queryFn: () => classesAPI.getById(classItem!.m02_id),
    enabled: open && !!classItem,
  })

  const classData = detailedClass || classItem

  if (!classData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {classData.m02_name}
          </DialogTitle>
          <DialogDescription>Class Details</DialogDescription>
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
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Subject: {classData.m02_subject}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Year: {classData.m02_year}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Teacher: {classData.m02_m01_teacher.m01_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Students: {classData.m02_m03_students.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Created: {new Date(classData.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last Updated: {new Date(classData.updated_at).toLocaleDateString()}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Enrolled Students ({classData.m02_m03_students.length})
              </h4>
              {classData.m02_m03_students.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {classData.m02_m03_students.map((student: any, index: number) => (
                    <Badge key={index} variant="outline">
                      Student {index + 1}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No students enrolled yet</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Class Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Class ID:</span>
                  <span className="ml-2 font-mono">#{classData.m02_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Teacher ID:</span>
                  <span className="ml-2 font-mono">#{classData.m02_m01_teacher_id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
