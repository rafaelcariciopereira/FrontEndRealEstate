import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  const APP_USER = process.env.APP_USER;
  const APP_PASSWORD = process.env.APP_PASSWORD;

  if (username !== APP_USER || password !== APP_PASSWORD) {
    return NextResponse.json(
      { error: 'Usuário ou senha inválidos.' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  session.user = { username, isLoggedIn: true };
  await session.save();

  return response;
}
