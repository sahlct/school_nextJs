"use client"

import { useQuery } from "@tanstack/react-query"
import { teachersAPI, studentsAPI, classesAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teachersAPI.getAll(),
  })

  const { data: studentsData } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsAPI.getAll(),
  })

  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classesAPI.getAll(),
  })

  const teachers = teachersData?.teachers || []
  const students = studentsData?.students || []
  const classes = classesData?.classes || []

  // Calculate statistics
  const totalTeachers = teachers.length
  const totalStudents = students.length
  const totalClasses = classes.length
  const avgClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0

  // Gender distribution for students - calculate from actual data
  const genderCounts = students.reduce(
    (acc, student) => {
      const gender = student.m03_gender || "Others"
      if (gender === "Male" || gender === "Female") {
        acc[gender] = (acc[gender] || 0) + 1
      } else {
        acc["Others"] = (acc["Others"] || 0) + 1
      }
      return acc
    },
    { Male: 0, Female: 0, Others: 0 } as Record<string, number>,
  )

  const totalGenderCount = genderCounts.Male + genderCounts.Female + genderCounts.Others
  const malePercentage = totalGenderCount > 0 ? (genderCounts.Male / totalGenderCount) * 100 : 0
  const femalePercentage = totalGenderCount > 0 ? (genderCounts.Female / totalGenderCount) * 100 : 0
  const othersPercentage = totalGenderCount > 0 ? (genderCounts.Others / totalGenderCount) * 100 : 0

  // Students per class - show minimum 4 charts
  const getClassData = () => {
    const classStudentCounts = classes.map((cls) => ({
      name: cls.m02_name,
      students: cls.m02_m03_students.length,
      highlight: false,
    }))

    // If we have 4 or more classes, show first 4
    if (classStudentCounts.length >= 4) {
      return classStudentCounts.slice(0, 4)
    }

    // If we have less than 4 classes, pad with empty data
    const emptySlots = 4 - classStudentCounts.length
    const emptyData = Array.from({ length: emptySlots }, (_, index) => ({
      name: `Class ${classStudentCounts.length + index + 1}`,
      students: 0,
      highlight: false,
    }))

    return [...classStudentCounts, ...emptyData]
  }

  const classData = getClassData()
  const maxStudents = Math.max(...classData.map(d => d.students), 1)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="lg:text-3xl text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Class Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClassSize}</div>
            <p className="text-xs text-muted-foreground">Students per class</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2 grid-cols-1">
        {/* Gender Distribution */}
        <Card className="rounded-2xl bg-white shadow-lg p-5 flex flex-col gap-4 h-full">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Gender Distribution</CardTitle>
              <CardDescription>Student gender ratio across all classes</CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 gap-6">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Male segment */}
                <path
                  className="text-blue-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${malePercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Female segment */}
                <path
                  className="text-pink-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${femalePercentage}, 100`}
                  strokeDashoffset={-malePercentage}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Others segment */}
                <path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${othersPercentage}, 100`}
                  strokeDashoffset={-(malePercentage + femalePercentage)}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalStudents}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>
                  Male ({genderCounts.Male}) - {malePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span>
                  Female ({genderCounts.Female}) - {femalePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>
                  Others ({genderCounts.Others}) - {othersPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Students per Class - Custom Bar Chart */}
        <Card className="rounded-2xl bg-white shadow-lg p-5 flex flex-col gap-4 h-full">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Students per Class</CardTitle>
              <CardDescription>Number of students enrolled in each class (showing top 4)</CardDescription>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-end justify-between h-48 gap-4 border-b border-dashed border-blue-400 pb-4">
              {classData.map((classItem, index) => {
                const barHeight = maxStudents > 0 ? (classItem.students / maxStudents) * 100 : 0
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex flex-col items-center justify-end h-40">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {classItem.students > 0 ? classItem.students : ''}
                      </div>
                      <div
                        className={`w-full max-w-12 rounded-t-lg transition-all duration-300 ${
                          classItem.students > 0 ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                        style={{
                          height: `${Math.max(barHeight, classItem.students > 0 ? 8 : 4)}%`,
                          minHeight: classItem.students > 0 ? '8px' : '4px'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center max-w-16 truncate">
                      {classItem.name}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Y-axis labels */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>0</span>
              <span>{Math.ceil(maxStudents / 2)}</span>
              <span>{maxStudents}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}