-- Knowledge base for AI advisor RAG
create table if not exists knowledge_chunks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source      text not null,
  category    text not null check (category in ('framework','benchmark','principle','industry')),
  industry    text,                     -- null = universal
  content     text not null,
  search_vector tsvector generated always as (
    to_tsvector('english',
      title || ' ' || source || ' ' ||
      coalesce(industry,'') || ' ' || content
    )
  ) stored,
  created_at  timestamptz default now()
);

create index if not exists knowledge_search_idx   on knowledge_chunks using gin (search_vector);
create index if not exists knowledge_category_idx on knowledge_chunks (category);
create index if not exists knowledge_industry_idx on knowledge_chunks (industry) where industry is not null;
