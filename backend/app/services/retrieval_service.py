from dataclasses import dataclass


@dataclass(frozen=True)
class RankedChunk:
    chunk_id: str
    rank: int


def reciprocal_rank_fusion(
    semantic_results: list[RankedChunk],
    lexical_results: list[RankedChunk],
    *,
    constant: int = 60,
    limit: int = 6,
) -> list[tuple[str, float]]:
    """Fuse two ranked result sets without allowing duplicate chunks."""
    scores: dict[str, float] = {}
    for result_set in (semantic_results, lexical_results):
        for result in result_set:
            scores[result.chunk_id] = scores.get(result.chunk_id, 0.0) + 1 / (constant + result.rank)
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))[:limit]

