"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { studentsAPI, classesAPI, type Student } from "@/lib/api"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface StudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
}

export function StudentModal({ open, onOpenChange, student }: StudentModalProps) {
  const [formData, setFormData] = useState({
    m03_name: "",
    m03_email: "",
    m03_contact_number: "",
    m03_gender: "Male" as "Male" | "Female" | "Other",
    m03_m02_class_id: 0,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const isEditing = !!student

  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classesAPI.getAll(),
  })

  const classes = classesData?.classes || []

  useEffect(() => {
    if (student) {
      setFormData({
        m03_name: student.m03_name,
        m03_email: student.m03_email,
        m03_contact_number: student.m03_contact_number,
        m03_gender: student.m03_gender || "Male",
        m03_m02_class_id: student.m03_m02_class_id || 0,
      })
      setPreviewUrl(student.m03_profile_photo)
      setSelectedFile(null)
    } else {
      setFormData({
        m03_name: "",
        m03_email: "",
        m03_contact_number: "",
        m03_gender: "Male",
        m03_m02_class_id: 0,
      })
      setPreviewUrl(null)
      setSelectedFile(null)
    }
  }, [student])

  const createMutation = useMutation({
    mutationFn: studentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("Student created successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create student")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => studentsAPI.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("Student updated successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update student")
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleFileCancel = () => {
    setSelectedFile(null)
    if (student) {
      setPreviewUrl(student.m03_profile_photo)
    } else {
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitFormData = new FormData()
    submitFormData.append("m03_name", formData.m03_name)
    submitFormData.append("m03_email", formData.m03_email)
    submitFormData.append("m03_contact_number", formData.m03_contact_number)
    submitFormData.append("m03_gender", formData.m03_gender)

    if (formData.m03_m02_class_id > 0) {
      submitFormData.append("m03_m02_class_id", formData.m03_m02_class_id.toString())
    }

    // Only append file if a new one is selected
    if (selectedFile) {
      submitFormData.append("m03_profile_photo", selectedFile)
    }

    if (isEditing && student) {
      updateMutation.mutate({
        id: student.m03_id,
        formData: submitFormData,
      })
    } else {
      createMutation.mutate(submitFormData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the student's information below." : "Fill in the details to add a new student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={previewUrl || ""} alt="Profile" />
                <AvatarFallback>{formData.m03_name.charAt(0).toUpperCase() || "S"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Photo
                </Button>
                {selectedFile && (
                  <Button type="button" variant="outline" size="sm" onClick={handleFileCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.m03_name}
                onChange={(e) => setFormData({ ...formData, m03_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.m03_email}
                onChange={(e) => setFormData({ ...formData, m03_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={formData.m03_contact_number}
                onChange={(e) => setFormData({ ...formData, m03_contact_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.m03_gender}
                onValueChange={(value: "Male" | "Female" | "Other") => setFormData({ ...formData, m03_gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class (Optional)</Label>
            <Select
              value={formData.m03_m02_class_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, m03_m02_class_id: Number.parseInt(value) || 0 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No class assigned</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.m02_id} value={classItem.m02_id.toString()}>
                    {classItem.m02_name} - {classItem.m02_subject}
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
