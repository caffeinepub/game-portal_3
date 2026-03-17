import type { Score } from "@/backend";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTopScores(game: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Score[]>({
    queryKey: ["topScores", game],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopScores(game);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllGameScores() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, Score[]]>>({
    queryKey: ["allGameScores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGameScores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      game,
      playerName,
      score,
    }: { game: string; playerName: string; score: number }) => {
      if (!actor) throw new Error("Not connected");
      await actor.submitScore(game, playerName, BigInt(score));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topScores"] });
      queryClient.invalidateQueries({ queryKey: ["allGameScores"] });
    },
  });
}
