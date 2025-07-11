"use client"

import { useAppSelector } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useAppSelector((state) => state.auth)

  return (
    <header className="flex-shrink-0 flex h-[68.5px] items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Prathee</h1>
      </div>
      <div className="flex items-center gap-1 cursor-pointer">
        {/* <span className="text-sm text-gray-600 hidden sm:inline">Welcome back,</span> */}
        <span className="text-sm font-medium text-gray-900 hidden sm:inline">{user?.name}</span>
        <img src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740" className="w-12 h-12 rounded-full " alt="" />
      </div>
    </header>
  )
}
