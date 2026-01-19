import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase client to refresh session if needed
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()

    // ROUTE PROTECTION RULES

    // 1. Protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            // If no user, redirect to login
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Check if user is admin (metadata or db query)
        // Basic check: if user role metadata says admin. 
        // Optimization: For strict security we should query DB, but we'll use user_metadata if available or just basic auth for now
        // Since we store role in DB, we'd need Service Role to query widely or specific RLS.
        // However, `supabase.auth.getUser()` fetches the auth user. The 'role' field in `volunteers` table is app-level.
        // Auth User Metadata might not have it unless we sync it. 
        // Let's rely on client-side + RLS for data protection, but Middleware can at least block unauthenticated.
        // Ideally we blocked non-admins.

        // NOTE: This basic middleware ensures at least a valid session.
        // For Role-Based Access Control (RBAC) in Middleware:
        // We would need to query the `volunteers` table.

        // Let's implement a quick check if we can.
        // But middleware edge runtime has limits. 
        // For now: BLOCK if not logged in.
        // Client-side will handle "User is logged in but not admin" (redirects to /dashboard).
        // This adds a layer of defense.
    }

    // 2. Redirect logged in users away from /login
    if (request.nextUrl.pathname === '/login' && user) {
        // If user is admin/volunteer, let client redirect? Or redirect to dashboard?
        // Let's redirect to root to let the root page decide (since it has logic for admin vs dashboard)
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
