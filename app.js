
/* ========================================================
   VOCALVAULT - SUPABASE AUTHENTICATION
   Uses Supabase Auth; never stores passwords in public.users
======================================================== */

async function registerUser(name, email, password) {
    name = name.trim();
    email = email.trim().toLowerCase();

    if (!name || !email || !password) {
        showToast('Please fill in all fields.', 'danger');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'danger');
        return;
    }

    if (!db.isSupabaseReady()) {
        showToast(
            'Supabase is not configured. Check Database Settings.',
            'danger'
        );
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) throw error;

        if (!data.user) {
            throw new Error('Supabase did not return a user.');
        }

        if (data.session) {
            currentUser = {
                id: data.user.id,
                name: data.user.user_metadata?.name || name,
                email: data.user.email || email
            };

            localStorage.setItem(
                STORAGE_KEYS.SESSION,
                JSON.stringify(currentUser)
            );

            showToast('Account created successfully!', 'success');
            router.navigate('dashboard');
        } else {
            showToast(
                'Account created. Please check your email to confirm your account, then sign in.',
                'success'
            );

            router.navigate('login');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast(
            'Registration failed: ' + error.message,
            'danger'
        );
    }
}


async function loginUser(email, password) {
    email = email.trim().toLowerCase();

    if (!email || !password) {
        showToast('Enter your email and password.', 'danger');
        return;
    }

    if (!db.isSupabaseReady()) {
        showToast('Supabase is not configured.', 'danger');
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        if (!data.user) {
            throw new Error('Login did not return a user.');
        }

        // Profile lookup is optional. Authentication itself is
        // handled securely by Supabase Auth.
        let profile = null;

        const result = await supabaseClient
            .from('users')
            .select('id, name, email')
            .eq('id', data.user.id)
            .maybeSingle();

        if (result.error) {
            console.warn('Profile lookup:', result.error.message);
        } else {
            profile = result.data;
        }

        currentUser = {
            id: data.user.id,
            name:
                profile?.name ||
                data.user.user_metadata?.name ||
                email.split('@')[0],
            email: data.user.email || email
        };

        localStorage.setItem(
            STORAGE_KEYS.SESSION,
            JSON.stringify(currentUser)
        );

        showToast(
            'Welcome back, ' + currentUser.name + '!',
            'success'
        );

        router.navigate('dashboard');
    } catch (error) {
        console.error('Login error:', error);
        showToast(
            'Login failed: ' + error.message,
            'danger'
        );
    }
}


async function logoutUser() {
    try {
        if (db.isSupabaseReady()) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        }

        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.SESSION);

        showToast('Logged out successfully.', 'success');
        router.navigate('home');
    } catch (error) {
        console.error('Logout error:', error);
        showToast(
            'Logout failed: ' + error.message,
            'danger'
        );
    }
}
