from app.services.retrieval_service import RankedChunk, reciprocal_rank_fusion


def test_rrf_rewards_chunks_found_by_both_retrievers():
    semantic = [RankedChunk("shared", 1), RankedChunk("semantic-only", 2)]
    lexical = [RankedChunk("lexical-only", 1), RankedChunk("shared", 2)]

    fused = reciprocal_rank_fusion(semantic, lexical)

    assert fused[0][0] == "shared"
    assert len({chunk_id for chunk_id, _ in fused}) == 3


def test_rrf_honors_final_context_limit():
    semantic = [RankedChunk(str(index), index + 1) for index in range(10)]

    assert len(reciprocal_rank_fusion(semantic, [], limit=6)) == 6

