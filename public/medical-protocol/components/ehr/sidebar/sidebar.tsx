// MedicalRecordsSidebar.jsx
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function MedicalRecordsSidebar({ records, onLoadRecord }) {
  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="border-b">
            <ThemeToggle />
          </SidebarGroupContent>
          <SidebarGroupLabel>
            Consultas Anteriores ({records.length})
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {records.length === 0 ? (
                <div className="p-4 text-center  text-sm">
                  No hay consultas anteriores para este paciente
                </div>
              ) : (
                records.map((record) => (
                  <SidebarMenuItem key={record.id}>
                    <SidebarMenuButton
                      onClick={() => onLoadRecord(record)}
                      className="flex flex-col items-start"
                    >
                      <div className="flex items-center gap-2 w-full mb-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {record.date}
                        </span>
                        <span className="text-xs ml-auto opacity-50">
                          {record.timestamp}
                        </span>
                      </div>

                      <div className="text-xs line-clamp-2 w-full">
                        {record.notes.substring(0, 80)}
                        {record.notes.length > 80 && "..."}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
