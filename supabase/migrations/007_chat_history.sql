-- Chat sessions and message history
create table if not exists chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null default 'New conversation',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz default now()
);

create index if not exists chat_sessions_workspace_idx on chat_sessions(workspace_id, updated_at desc);
create index if not exists chat_messages_session_idx   on chat_messages(session_id, created_at asc);

-- Auto-update updated_at on chat_sessions
create or replace function touch_chat_session()
returns trigger language plpgsql as $$
begin
  update chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

create trigger chat_message_touch
after insert on chat_messages
for each row execute function touch_chat_session();

-- RLS
alter table chat_sessions enable row level security;
alter table chat_messages  enable row level security;

create policy "users see own sessions" on chat_sessions
  for all using (user_id = auth.uid());

create policy "users see messages in own sessions" on chat_messages
  for all using (
    session_id in (select id from chat_sessions where user_id = auth.uid())
  );
