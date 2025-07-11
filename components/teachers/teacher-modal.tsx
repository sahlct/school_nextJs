"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { teachersAPI, type Teacher } from "@/lib/api"
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
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

interface TeacherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: Teacher | null
}

export function TeacherModal({ open, onOpenChange, teacher }: TeacherModalProps) {
  const [formData, setFormData] = useState({
    m01_name: "",
    m01_email: "",
    m01_contact_number: "",
    m01_password: "",
    m01_is_admin: false,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()
  const isEditing = !!teacher

  useEffect(() => {
    if (teacher) {
      setFormData({
        m01_name: teacher.m01_name,
        m01_email: teacher.m01_email,
        m01_contact_number: teacher.m01_contact_number,
        m01_password: "", // Don't pre-fill password for security
        m01_is_admin: teacher.m01_is_admin,
      })
      setPreviewUrl(teacher.m01_profile_photo)
      setSelectedFile(null)
    } else {
      setFormData({
        m01_name: "",
        m01_email: "",
        m01_contact_number: "",
        m01_password: "",
        m01_is_admin: false,
      })
      setPreviewUrl(null)
      setSelectedFile(null)
    }
  }, [teacher])

  const createMutation = useMutation({
    mutationFn: teachersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      toast.success("Teacher created successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create teacher")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => teachersAPI.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      toast.success("Teacher updated successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update teacher")
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
    if (teacher) {
      setPreviewUrl(teacher.m01_profile_photo)
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
    submitFormData.append("m01_name", formData.m01_name)
    submitFormData.append("m01_email", formData.m01_email)
    submitFormData.append("m01_contact_number", formData.m01_contact_number)
    submitFormData.append("m01_is_admin", formData.m01_is_admin.toString())

    // Only append password if it's provided (for create or update)
    if (formData.m01_password) {
      submitFormData.append("m01_password", formData.m01_password)
    }

    // Only append file if a new one is selected
    if (selectedFile) {
      submitFormData.append("m01_profile_photo", selectedFile)
    }

    if (isEditing && teacher) {
      updateMutation.mutate({
        id: teacher.m01_id,
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
          <DialogTitle>{isEditing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the teacher's information below." : "Fill in the details to add a new teacher."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={previewUrl || ""} alt="Profile" />
                <AvatarFallback>{formData.m01_name.charAt(0).toUpperCase() || "T"}</AvatarFallback>
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
                value={formData.m01_name}
                onChange={(e) => setFormData({ ...formData, m01_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.m01_email}
                onChange={(e) => setFormData({ ...formData, m01_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={formData.m01_contact_number}
                onChange={(e) => setFormData({ ...formData, m01_contact_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.m01_password}
                onChange={(e) => setFormData({ ...formData, m01_password: e.target.value })}
                required={!isEditing}
                placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="admin"
              checked={formData.m01_is_admin}
              onCheckedChange={(checked) => setFormData({ ...formData, m01_is_admin: checked })}
            />
            <Label htmlFor="admin">Admin Access</Label>
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
