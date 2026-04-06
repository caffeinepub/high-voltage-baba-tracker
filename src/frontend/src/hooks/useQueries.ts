import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CoordEntry } from "../backend";
import { useActor } from "./useActor";

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<CoordEntry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getAllEntries();
      // Sort newest first by timestamp
      return [...entries].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMultipleEntries() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Array<[bigint, string, string]>) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addMultipleEntries(entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useRemoveEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.removeEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
