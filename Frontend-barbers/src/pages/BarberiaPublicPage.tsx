import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function BarberiaPublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      const numId = Number(id);
      if (!numId || Number.isNaN(numId)) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await api.getBarberiaPublica(numId);
        if (res.slug) {
          navigate(`/b/${res.slug}`, { replace: true });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    };

    redirect();
  }, [id, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0c10]">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
    </div>
  );
}
