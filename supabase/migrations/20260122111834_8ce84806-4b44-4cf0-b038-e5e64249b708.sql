-- Remove the public access policy from profiles table
DROP POLICY IF EXISTS "Anyone can lookup username" ON public.profiles;

-- The existing policies for authenticated users are already in place:
-- "Admins can view all profiles" (SELECT)
-- "Users can view their own profile" (SELECT)
-- "Users can update their own profile" (UPDATE)
-- "Admins can update all profiles" (UPDATE)
-- "Admins can delete profiles" (DELETE)
-- "Users can insert their own profile" (INSERT)

-- Note: The treatment_plans and monthly_expenses tables already have proper authenticated-only policies.
-- The issue was the "Anyone can lookup username" policy on profiles which allowed unauthenticated access.