-- Ensure role management policies include WITH CHECK (PostgREST may silently affect 0 rows otherwise)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bootstrap: allow the very first admin to be claimed (only if no admins exist)
CREATE OR REPLACE FUNCTION public.no_admins_exist()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role
  );
$$;

CREATE POLICY "Bootstrap first admin (self)"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() = user_id
  AND no_admins_exist()
)
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::app_role
  AND no_admins_exist()
);

CREATE POLICY "Bootstrap first admin (insert)"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::app_role
  AND no_admins_exist()
);