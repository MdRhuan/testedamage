import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface UseBulkDeleteOptions {
  endpoint: string;
  queryKey: string[];
  entityName: string;
  entityNamePlural: string;
}

/**
 * Reusable hook for bulk delete operations with confirmation dialog
 */
export function useBulkDelete({
  endpoint,
  queryKey,
  entityName,
  entityNamePlural
}: UseBulkDeleteOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Failed to delete ${entityNamePlural}`);
      }
      return await response.json();
    },
    onSuccess: (data: { deletedCount: number }) => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: `${entityNamePlural} deletados`,
        description: `${data.deletedCount} ${data.deletedCount === 1 ? entityName : entityNamePlural} ${data.deletedCount === 1 ? 'foi' : 'foram'} removido${data.deletedCount === 1 ? '' : 's'} com sucesso.`,
      });
      setShowDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: `Não foi possível deletar os ${entityNamePlural}. Tente novamente.`,
        variant: "destructive",
      });
    },
  });

  return {
    showDialog,
    setShowDialog,
    mutation,
    openDialog: () => setShowDialog(true),
    closeDialog: () => setShowDialog(false)
  };
}
