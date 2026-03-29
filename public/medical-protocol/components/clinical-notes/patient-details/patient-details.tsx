import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatientDetailsProps {
  currentRecord: {
    patientName: string;
    patientAge: string;
  };
  isSaved: boolean;
}

export const PatientDetails = ({ currentRecord, isSaved }: PatientDetailsProps) => {
  return (
    <div className="flex gap-6 items-center justify-between w-full">
      <div className="flex items-baseline gap-2">
        <span>{currentRecord.patientName}</span>
        {currentRecord.patientAge && (
          <small className="opacity-50">{currentRecord.patientAge} años</small>
        )}
      </div>
      {isSaved && (
        <Badge>
          <Save /> Guardado!
        </Badge>
      )}
    </div>
  );
};
