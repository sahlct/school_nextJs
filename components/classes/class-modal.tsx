"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { classesAPI, teachersAPI, type Class } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classItem: Class | null
}

export function ClassModal({ open, onOpenChange, classItem }: ClassModalProps) {
  const [formData, setFormData] = useState({
    m02_name: "",
    m02_subject: "",
    m02_year: new Date().getFullYear(),
    m02_m01_teacher_id: 0,
  })

  const queryClient = useQueryClient()
  const isEditing = !!classItem

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teachersAPI.getAll(),
  })

  const teachers = teachersData?.teachers || []

  useEffect(() => {
    if (classItem) {
      setFormData({
        m02_name: classItem.m02_name,
        m02_subject: classItem.m02_subject,
        m02_year: classItem.m02_year,
        m02_m01_teacher_id: classItem.m02_m01_teacher_id,
      })
    } else {
      setFormData({
        m02_name: "",
        m02_subject: "",
        m02_year: new Date().getFullYear(),
        m02_m01_teacher_id: 0,
      })
    }
  }, [classItem])

  const createMutation = useMutation({
    mutationFn: classesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class created successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create class")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof formData }) => classesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class updated successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update class")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && classItem) {
      updateMutation.mutate({
        id: classItem.m02_id,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Class" : "Add New Class"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the class information below." : "Fill in the details to add a new class."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={formData.m02_name}
                onChange={(e) => setFormData({ ...formData, m02_name: e.target.value })}
                placeholder="e.g., Mathematics 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2030"
                value={formData.m02_year}
                onChange={(e) => setFormData({ ...formData, m02_year: Number.parseInt(e.target.value) || 2025 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.m02_subject}
              onChange={(e) => setFormData({ ...formData, m02_subject: e.target.value })}
              placeholder="e.g., Advanced Mathematics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Assigned Teacher</Label>
            <Select
              value={formData.m02_m01_teacher_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, m02_m01_teacher_id: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.m01_id} value={teacher.m01_id.toString()}>
                    {teacher.m01_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
