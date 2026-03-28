    const defaultRecords = [
      {
        id: 1,
        patientName: "Jose Garcia",
        patientAge: "52",
        date: "2024-07-20",
        notes: `Motivo de consulta:
    Dolor en el pecho y dificultad para respirar.
    
    Enfermedad actual:
    Paciente masculino de 52 años que refiere dolor precordial de 2 horas de evolución, de tipo opresivo, irradiado a brazo izquierdo, acompañado de disnea y sudoración profusa.
    
    Antecedentes personales:
    Hipertensión arterial en tratamiento con enalapril 10mg. Tabaquismo 30 cigarrillos/día por 25 años. Padre falleció por infarto agudo de miocardio a los 58 años.
    
    Examen físico:
    Paciente ansioso, diaforético. TA: 160/95 mmHg, FC: 98 lpm, FR: 22 rpm. Auscultación cardíaca: ritmo regular, no soplos. Pulmones: murmullo vesicular conservado.`,
        diagnosis: "Síndrome coronario agudo en estudio",
        treatment: "AAS 300mg, Clopidogrel 600mg, Atorvastatina 80mg. Internación en UCO.",
        timestamp: "2 días",
        analysis: null, // Add this property
      },
      {
        id: 2,
        patientName: "Jose Garcia",
        patientAge: "52",
        date: "2024-07-19",
        notes: `Control post-alta:
    
    Evolución:
    Paciente refiere mejoría significativa del dolor precordial. Tolera bien la medicación prescrita. No presenta disnea de reposo.
    
    Examen físico:
    Buen estado general. TA: 135/85 mmHg, FC: 76 lpm. Auscultación normal.
    
    Laboratorio:
    Colesterol total: 180 mg/dl, HDL: 45 mg/dl, LDL: 110 mg/dl, Triglicéridos: 125 mg/dl.`,
        diagnosis: "Síndrome coronario agudo - En tratamiento",
        treatment: "Continuar AAS, Clopidogrel, Atorvastatina. Control en 1 semana.",
        timestamp: "3 días",
      },
      {
        id: 3,
        patientName: "Jose Garcia",
        patientAge: "52",
        date: "2024-07-15",
        notes: `Control de rutina:
    
    Motivo de consulta:
    Control de hipertensión arterial.
    
    Evolución:
    Paciente asintomático. Refiere adherencia al tratamiento antihipertensivo. Mantiene hábito tabáquico.
    
    Examen físico:
    Buen estado general. TA: 140/90 mmHg, FC: 72 lpm, Peso: 78 kg.`,
        diagnosis: "Hipertensión arterial controlada",
        treatment: "Continuar enalapril 10mg. Consejería antitabáquica.",
        timestamp: "1 semana",
        analysis: null, // Add this property
      },
      // Records for other patients (these won't show for Jose Garcia)
      {
        id: 4,
        patientName: "John Smith",
        patientAge: "45",
        date: "2024-07-20",
        notes: `Routine checkup:
    
    Physical examination:
    All vitals normal. Patient appears healthy and well-nourished.
    
    Assessment:
    No acute concerns identified during routine examination.`,
        diagnosis: "Routine examination",
        treatment: "Continue current medications",
        timestamp: "2 días",
        analysis: null, // Add this property
      },
      {
        id: 5,
        patientName: "Sarah Johnson",
        patientAge: "35",
        date: "2024-07-19",
        notes: `Chief complaint:
    Persistent headaches over the past week.
    
    History of present illness:
    Patient reports daily headaches, mainly in the temporal region, associated with work stress. No visual disturbances or nausea.
    
    Physical examination:
    Neurological examination normal. Blood pressure within normal limits.`,
        diagnosis: "Tension headache",
        treatment: "Prescribed ibuprofen, stress management",
        timestamp: "3 días",
        analysis: null, // Add this property
      },
    ]
    
    export default defaultRecords