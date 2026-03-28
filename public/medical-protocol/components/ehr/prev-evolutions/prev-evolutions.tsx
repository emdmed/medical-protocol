import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Calendar, FileText, X, FileClock } from "lucide-react";

const PrevEvolutions = ({ allRecords }) => {
  const previousRecords = allRecords?.slice(1) || [];
  
  if (!previousRecords.length) {
    return null;
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="gap-2" size="icon">
         <FileClock/>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <DrawerTitle>Evoluciones médicas previas</DrawerTitle>
                <DrawerDescription>
                  Historial de {previousRecords.length - 1} {previousRecords.length === 1 ? 'nota previa' : 'notas previas'}
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <X className="h-4 w-4" />
                Cerrar
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
          <div className="space-y-4">
            {previousRecords.map((record, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDate(record.date)}
                    </span>
                  </div>
                  {index === 0 && (
                    <Badge variant="default">Más reciente</Badge>
                  )}
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {record.notes || "Sin notas disponibles"}
                  </div>
                </div>
                
                {index < previousRecords.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PrevEvolutions;