import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

const protectedRoutes = ['/admin', '/teacher'];
const publicRoutes = ['/login', '/'];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isPublicRoute = publicRoutes.includes(path);

    const cookie = req.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie).catch(() => null) : null;

    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isPublicRoute && session) {
        const role = session.user.role;
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
        } else if (role === 'teacher') {
            return NextResponse.redirect(new URL('/teacher/dashboard', req.nextUrl));
        }
    }

    // Role-based access control
    if (path.startsWith('/admin') && session?.user.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (path.startsWith('/teacher') && session?.user.role !== 'teacher') {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
