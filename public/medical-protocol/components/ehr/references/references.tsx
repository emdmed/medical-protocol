import { Badge } from "@/components/ui/badge";

const References = () => {
  const legendItems = [
    {
      section: "Motivo de consulta",
      colorClass: "bg-blue-500/30  text-foreground dark:text-blue-200",
    },
    {
      section: "Enfermedad actual",
      colorClass: "bg-amber-500/30 text-foreground dark:text-amber-200",
    },
    {
      section: "Antecedentes personales", 
      colorClass: "bg-green-500/30 text-foreground dark:text-green-200",
    },
    {
      section: "Examen físico",
      colorClass: "bg-purple-500/30 text-foreground darK:text-purple-200",
    },
    {
      section: "Tratamiento iniciado",
      colorClass: "bg-cyan-500/30  text-foreground dar:text-cyan-200",
    }
  ];

  return (
    <div className="flex-1">
      <div className="flex flex-wrap gap-3 items-center justify-end">
        {legendItems.map((item, index) => (
          <Badge key={index} className={`${item.colorClass} font-medium`}>
            {item.section}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default References;