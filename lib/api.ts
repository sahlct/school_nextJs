// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Types
export interface User {
  id: number
  name: string
  email: string
  contact_number: string
  isAdmin: boolean
  role: string
}

export interface LoginResponse {
  status: string
  message: string
  data: User
  token: string
}

export interface OTPResponse {
  status: string
  message: string
}

export interface Teacher {
  m01_id: number
  m01_name: string
  m01_email: string
  m01_contact_number: string
  m01_profile_photo: string | null
  m01_is_admin: boolean
  m01_created_at: string
  m01_updated_at: string
  m01_classes: Array<{
    m02_id: number
    m02_name: string
  }>
}

export interface TeachersResponse {
  status: string
  message: string
  data: {
    teachers: Teacher[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface TeacherResponse {
  status: string
  message: string
  data: Teacher
}

export interface Class {
  m02_id: number
  m02_name: string
  m02_subject: string
  m02_year: number
  m02_m01_teacher_id: number
  created_at: string
  updated_at: string
  m02_m01_teacher: {
    m01_id: number
    m01_name: string
  }
  m02_m03_students: any[]
}

export interface ClassesResponse {
  status: string
  message: string
  data: {
    classes: Class[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface ClassResponse {
  status: string
  message: string
  data: Class
}

export interface Student {
  m03_id: number
  m03_name: string
  m03_email: string
  m03_contact_number: string
  m03_profile_photo: string | null
  m03_gender?: "Male" | "Female" | "Other"
  m03_m02_class_id?: number
  m03_enrollment_date: string
  created_at: string
  updated_at: string
  m03_m02_classes: any[]
}

export interface StudentsResponse {
  status: string
  message: string
  data: {
    students: Student[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface StudentResponse {
  status: string
  message: string
  data: Student
}

// Token management with debugging
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      console.log("Getting token:", token ? "Token exists" : "No token found")
      return token
    }
    console.log("Window is undefined, returning null")
    return null
  },

  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
      console.log("Token set successfully")
    }
  },

  removeToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      console.log("Token removed")
    }
  },
}

// Enhanced API helper function with better debugging
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const token = tokenManager.getToken()
  
  console.log("API Request Debug:", {
    url,
    method: options.method || "GET",
    hasToken: !!token,
    token: token ? `${token.substring(0, 20)}...` : "No token"
  })

  // Ensure headers object exists
  const headers = {
    ...(options.headers || {}),
  }

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`
    console.log("Authorization header added:", headers.Authorization.substring(0, 20) + "...")
  } else {
    console.log("No token available, skipping Authorization header")
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  console.log("Final request config:", {
    url,
    method: config.method || "GET",
    headers: config.headers,
    hasBody: !!config.body
  })

  try {
    const response = await fetch(url, config)
    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Network error" }))
      console.log("Error response:", errorData)
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // For export endpoint, return blob directly
    if (endpoint === "/students/export") {
      return response.blob()
    }

    return response.json()
  } catch (error) {
    console.error("API Request failed:", error)
    throw error
  }
}

// Authentication API (no Bearer token needed)
export const authAPI = {
  login: async (email: string, password: string): Promise<User> => {
    const response: LoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        m01_email: email,
        m01_password: password,
      }),
    }).then((res) => res.json())

    if (response.status === "Success") {
      tokenManager.setToken(response.token)
      return response.data
    }

    throw new Error(response.message || "Login failed")
  },

  sendOTP: async (email: string): Promise<{ success: boolean }> => {
    const response: OTPResponse = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    }).then((res) => res.json())

    if (response.status === "Success") {
      return { success: true }
    }

    throw new Error(response.message || "Failed to send OTP")
  },

  verifyOTP: async (email: string, otp: string): Promise<User> => {
    const response: LoginResponse = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        otp: otp,
      }),
    }).then((res) => res.json())

    if (response.status === "Success") {
      tokenManager.setToken(response.token)
      return response.data
    }

    throw new Error(response.message || "OTP verification failed")
  },

  logout: (): void => {
    tokenManager.removeToken()
  },

  checkAuth: (): boolean => {
    const hasToken = !!tokenManager.getToken()
    console.log("Auth check:", hasToken)
    return hasToken
  },
}

// Teachers API (with Bearer token)
export const teachersAPI = {
  getAll: async (page = 1, limit = 10, search = ""): Promise<TeachersResponse["data"]> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ""
    const response: TeachersResponse = await apiRequest(`/teachers?page=${page}&limit=${limit}${searchParam}`)

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to fetch teachers")
  },

  getById: async (id: number): Promise<Teacher> => {
    const response: TeacherResponse = await apiRequest(`/teachers/${id}`)

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to fetch teacher")
  },

  create: async (formData: FormData): Promise<Teacher> => {
    const response: TeacherResponse = await apiRequest("/teachers", {
      method: "POST",
      body: formData,
    })

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to create teacher")
  },

  update: async (id: number, formData: FormData): Promise<Teacher> => {
    const response: TeacherResponse = await apiRequest(`/teachers/${id}`, {
      method: "PUT",
      body: formData,
    })

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to update teacher")
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiRequest(`/teachers/${id}`, {
      method: "DELETE",
    })

    if (response.status !== "Success") {
      throw new Error(response.message || "Failed to delete teacher")
    }
  },
}

// Classes API (with Bearer token)
export const classesAPI = {
  getAll: async (page = 1, limit = 10, search = ""): Promise<ClassesResponse["data"]> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ""
    const response: ClassesResponse = await apiRequest(`/classes?page=${page}&limit=${limit}${searchParam}`)

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to fetch classes")
  },

  getById: async (id: number): Promise<Class> => {
    const response: ClassResponse = await apiRequest(`/classes/${id}`)

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to fetch class")
  },

  create: async (classData: {
    m02_name: string
    m02_subject: string
    m02_year: number
    m02_m01_teacher_id: number
  }): Promise<Class> => {
    console.log("Creating class with data:", classData)
    
    const response: ClassResponse = await apiRequest("/classes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classData),
    })

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to create class")
  },

  update: async (
    id: number,
    classData: {
      m02_name: string
      m02_subject: string
      m02_year: number
      m02_m01_teacher_id: number
    },
  ): Promise<Class> => {
    console.log("Updating class with ID:", id, "Data:", classData)
    
    const response: ClassResponse = await apiRequest(`/classes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classData),
    })

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to update class")
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiRequest(`/classes/${id}`, {
      method: "DELETE",
    })

    if (response.status !== "Success") {
      throw new Error(response.message || "Failed to delete class")
    }
  },
}

// Students API (with Bearer token)
export const studentsAPI = {
  getAll: async (page = 1, limit = 10, search = ""): Promise<StudentsResponse["data"]> => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ""
    const response: StudentsResponse = await apiRequest(`/students?page=${page}&limit=${limit}${searchParam}`)

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to fetch students")
  },

  getById: async (id: number): Promise<Student> => {
    const response: StudentResponse = await apiRequest(`/students/${id}`)

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to fetch student")
  },

  create: async (formData: FormData): Promise<Student> => {
    const response: StudentResponse = await apiRequest("/students", {
      method: "POST",
      body: formData,
    })

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to create student")
  },

  update: async (id: number, formData: FormData): Promise<Student> => {
    const response: StudentResponse = await apiRequest(`/students/${id}`, {
      method: "PUT",
      body: formData,
    })

    if (response.status === "Success") {
      return response.data
    }

    throw new Error(response.message || "Failed to update student")
  },

  delete: async (id: number): Promise<void> => {
    const response = await apiRequest(`/students/${id}`, {
      method: "DELETE",
    })

    if (response.status !== "Success") {
      throw new Error(response.message || "Failed to delete student")
    }
  },

  export: async (): Promise<void> => {
    const blob = await apiRequest("/students/export")
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students_export.xlsx"
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },

  import: async (file: File): Promise<{ data: { createdCount: number; errors?: string[] } }> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiRequest("/students/import", {
      method: "POST",
      body: formData,
    })

    if (response.status === "Success") {
      return response
    }

    throw new Error(response.message || "Failed to import students")
  },
}

// Utility function to manually check token and make a test request
export const debugAuth = {
  checkToken: () => {
    const token = tokenManager.getToken()
    console.log("Current token:", token)
    console.log("Token exists:", !!token)
    return !!token
  },
  
  testAuthRequest: async () => {
    try {
      const response = await apiRequest("/teachers?page=1&limit=1")
      console.log("Test auth request successful:", response)
      return true
    } catch (error) {
      console.error("Test auth request failed:", error)
      return false
    }
  }
}