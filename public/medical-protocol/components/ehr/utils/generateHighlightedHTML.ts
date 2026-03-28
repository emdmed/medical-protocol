/* eslint-disable @typescript-eslint/no-explicit-any */

// Define proper types for the function parameters and return values
interface AnalysisData {
  analysis: string | object;
  [key: string]: any;
}

interface TermsByCategory {
  [category: string]: string[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateHighlightedHTML(noteText: string, jsonData: AnalysisData): string {
  // Sanitize the note text before any HTML insertion
  const sanitizedText = escapeHtml(noteText);

  // Extract terms with their categories
  const termsByCategory = extractTermsByCategory(jsonData);

  // Highlight all terms in the sanitized text
  const highlightedContent = highlightTerms(sanitizedText, termsByCategory);
  
  return `
    <div class="max-w-4xl mx-auto p-4">
      <div class="whitespace-pre-wrap leading-relaxed">${highlightedContent}</div>
    </div>
  `;
}

function extractTermsByCategory(data: any): TermsByCategory {
  const termsByCategory: TermsByCategory = {};
  
  function extractFromValue(value: any, category: string): void {
    if (typeof value === 'string' && value.trim().length > 1) {
      if (!termsByCategory[category]) termsByCategory[category] = [];
      termsByCategory[category].push(value.trim());
    } else if (typeof value === 'number') {
      if (!termsByCategory[category]) termsByCategory[category] = [];
      termsByCategory[category].push(value.toString());
    } else if (Array.isArray(value)) {
      value.forEach(item => extractFromValue(item, category));
    } else if (typeof value === 'object' && value !== null) {
      // Only use first-level category, don't create sub-categories
      Object.values(value).forEach(val => extractFromValue(val, category));
    }
  }
  
  Object.entries(data).forEach(([key, value]) => {
    extractFromValue(value, key);
  });
  
  // Remove duplicates from each category
  Object.keys(termsByCategory).forEach(category => {
    termsByCategory[category] = [...new Set(termsByCategory[category])];
  });
  
  return termsByCategory;
}

function highlightTerms(text: string, termsByCategory: TermsByCategory): string {
  let result = text;
  
  // Color mapping for different categories - simplified to first-order properties only
  const categoryColors: { [key: string]: string } = {
    'chief_complaint': 'bg-blue-500/30 text-foreground dark:text-blue-200',
    'present_illness': 'bg-amber-500/30 text-foreground dark:text-amber-200',
    'personal_history': 'bg-green-500/30  text-foreground dark:text-green-200',
    'physical_exam': 'bg-purple-500/30 text-foreground dark:text-purple-200',
    'treatment_started': 'bg-cyan-500/30 text-foreground dark:text-cyan-200',
    'surgery_performed': 'bg-teal-500/30 text-foreground dark:text-teal-200',
    'default': 'bg-yellow-500/30  text-foreground dark:text-yellow-200'
  };
  
  // Section headers to avoid highlighting
  const sectionHeaders: RegExp[] = [
    /motivo\s+de\s+consulta/i,
    /enfermedad\s+actual/i,
    /antecedentes\s+personales/i,
    /examen\s+físico/i
  ];
  
  // Sort categories by term length to avoid partial matches
  const sortedCategories = Object.entries(termsByCategory).map(([category, terms]) => ({
    category,
    terms: (terms as string[]).sort((a, b) => b.length - a.length)
  }));
  
  sortedCategories.forEach(({ category, terms }) => {
    const colorClass = categoryColors[category] || categoryColors.default;
    
    terms.forEach((term: string) => {
      if (!term) return;
      
      // Skip section headers
      const isHeader = sectionHeaders.some(pattern => pattern.test(term));
      if (isHeader) return;
      
      // Create regex to find the term - escape special characters
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
      
      // Replace with highlighted version
      result = result.replace(regex, (match: string, offset: number, string: string) => {
        // Don't highlight if already inside a span tag
        const beforeMatch = string.substring(0, offset);
        const openSpans = (beforeMatch.match(/<span/g) || []).length;
        const closeSpans = (beforeMatch.match(/<\/span>/g) || []).length;
        
        if (openSpans > closeSpans) return match;
        
        // Don't highlight section headers
        const context = string.substring(Math.max(0, offset - 20), offset + match.length + 20);
        const inHeader = sectionHeaders.some(pattern => pattern.test(context));
        if (inHeader) return match;
        
        return `<span class="${colorClass} px-1 rounded font-medium">${match}</span>`;
      });
    });
  });
  
  return result;
}