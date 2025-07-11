"use client"

import { useQuery } from "@tanstack/react-query"
import { studentsAPI, type Student } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Phone, Calendar, User, GraduationCap } from "lucide-react"

interface StudentDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
}

export function StudentDetailModal({ open, onOpenChange, student }: StudentDetailModalProps) {
  // Fetch detailed student data when modal opens
  const { data: detailedStudent, isLoading } = useQuery({
    queryKey: ["student", student?.m03_id],
    queryFn: () => studentsAPI.getById(student!.m03_id),
    enabled: open && !!student,
  })

  const studentData = detailedStudent || student

  if (!studentData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={studentData.m03_profile_photo || ""} alt={studentData.m03_name} />
              <AvatarFallback>{studentData.m03_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{studentData.m03_name}</h3>
              {studentData.m03_gender && (
                <Badge
                  variant={
                    studentData.m03_gender === "Male"
                      ? "default"
                      : studentData.m03_gender === "Female"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {studentData.m03_gender}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>Student Details</DialogDescription>
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
              <span className="text-sm">{studentData.m03_email}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{studentData.m03_contact_number}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Enrolled: {new Date(studentData.m03_enrollment_date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Created: {new Date(studentData.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last Updated: {new Date(studentData.updated_at).toLocaleDateString()}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Enrolled Classes ({studentData.m03_m02_classes.length})
              </h4>
              {studentData.m03_m02_classes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {studentData.m03_m02_classes.map((classItem: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {classItem.name || `Class ${index + 1}`}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No classes enrolled</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Student Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="ml-2 font-mono">#{studentData.m03_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>
                  {studentData.m03_gender ? (
                    <Badge
                      variant={
                        studentData.m03_gender === "Male"
                          ? "default"
                          : studentData.m03_gender === "Female"
                            ? "secondary"
                            : "outline"
                      }
                      className="ml-2"
                    >
                      {studentData.m03_gender}
                    </Badge>
                  ) : (
                    <span className="ml-2 text-muted-foreground">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
