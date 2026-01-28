-- Supabase setup for AI analysis fallback (Supabase Hybrid Search).
-- Run this in the Supabase SQL Editor. Uses pgvector + full-text search.

create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where (filter = '{}'::jsonb) or (d.metadata @> filter)
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

create or replace function kw_match_documents(query_text text, match_count int)
returns table (id bigint, content text, metadata jsonb, similarity real)
language plpgsql
as $$
begin
  return query execute
  format(
    'select id, content, metadata, ts_rank(to_tsvector(''english'', content), plainto_tsquery(''english'', $1))::real as similarity
     from documents
     where to_tsvector(''english'', content) @@ plainto_tsquery(''english'', $1)
     order by similarity desc
     limit $2'
  )
  using query_text, match_count;
end;
$$;
