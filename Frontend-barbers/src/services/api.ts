const API_URL = import.meta.env.VITE_API_URL || 'http://82.25.86.90:8081/api';

export type PagoModo = 'sin_pago' | 'abono' | 'pago_total';

export type LandingConfig = {
  color_principal: string;
  color_secundario: string;
  mensaje_bienvenida: string;
  descripcion: string;
  whatsapp: string;
  banner: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  footer_texto: string;
  pago_modo?: PagoModo;
  pago_nequi?: string;
  pago_daviplata?: string;
  pago_cuenta_bancaria?: string;
  pago_monto_abono?: string | number;
  pago_hold_minutos?: string | number;
};

export type BarberiaPublica = {
  id: number;
  slug: string;
  nombre: string;
  logo?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
};

export type BarberoPublico = {
  id: number;
  uuid: string;
  nombre: string;
  foto?: string | null;
  especialidad?: string | null;
  telefono?: string | null;
};

export type ProductoPublico = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
};

export type ServicioPublico = {
  uuid: string;
  nombre: string;
  precio: number;
  duracion: number;
};

export type GaleriaCortePublico = {
  id: number;
  titulo?: string | null;
  imagen: string;
  orden: number;
};

export type GaleriaCorte = GaleriaCortePublico;

export type LandingPageData = {
  barberia: BarberiaPublica;
  landing: LandingConfig;
  barberos: BarberoPublico[];
  servicios: ServicioPublico[];
  productos: ProductoPublico[];
  galeria: GaleriaCortePublico[];
};

export type DisponibilidadResponse = {
  disponible: boolean;
  motivo?: string;
  hora_inicio?: string;
  hora_fin?: string;
  horas_ocupadas?: string[];
};

export type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email?: string | null;
  user_id?: number | null;
  registrado?: boolean;
};

export type ClienteAdmin = {
  id: number;
  nombre: string;
  telefono: string;
  email?: string | null;
  registrado: boolean;
  total_turnos: number;
  ultima_fecha: string | null;
};

export type MovimientoInventario = {
  id: number;
  barberia_id: number;
  producto_id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  descripcion?: string | null;
  created_at?: string;
  producto?: Pick<Producto, 'id' | 'nombre' | 'stock'>;
};

export type InventarioKpi = {
  total_productos: number;
  unidades_totales: number;
  valor_inventario: number;
  entradas_mes: number;
  salidas_mes: number;
  neto_mes: number;
  movimientos_mes: number;
};

export type InventarioActividadProducto = {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
  imagen?: string | null;
  entradas: number;
  salidas: number;
};

export type InventarioResumen = {
  kpi: InventarioKpi;
  productos: Pick<Producto, 'id' | 'nombre' | 'stock' | 'precio' | 'imagen'>[];
  stock_bajo: Pick<Producto, 'id' | 'nombre' | 'stock' | 'precio'>[];
  actividad_mes: InventarioActividadProducto[];
};

export type ReportesResponse = {
  periodo: { desde: string; hasta: string; label: string };
  resumen: {
    turnos_total: number;
    turnos_pendientes: number;
    turnos_confirmados: number;
    turnos_completados: number;
    turnos_cancelados: number;
    ingresos: number;
    ticket_promedio: number;
    clientes_registrados: number;
    barberos_activos: number;
    servicios_activos: number;
  };
  turnos_por_estado: Record<string, number>;
  por_barbero: { nombre: string; total: number; ingresos: number }[];
  por_servicio: { nombre: string; total: number; ingresos: number }[];
  turnos_por_dia: { fecha: string; total: number }[];
  ultimos_turnos: {
    id: number;
    fecha: string;
    hora: string;
    estado: TurnoEstado;
    precio: number;
    barbero?: string;
    servicio?: string;
    cliente?: string;
  }[];
  inventario: {
    total_productos: number;
    unidades_stock: number;
    valor_inventario: number;
    stock_bajo: number;
    entradas_periodo: number;
    salidas_periodo: number;
  };
};

type ReservaPublicaResponse = {
  message: string;
  data: {
    uuid: string;
    barbero: string;
    servicio: string;
    fecha: string;
    hora: string;
    estado: string;
    precio: number;
    cita_url: string;
    qr_payload: string;
    pago_monto_esperado?: number | null;
    hold_expires_at?: string | null;
    requiere_comprobante?: boolean;
    requiere_pago?: boolean;
    pago_modo?: PagoModo;
    pago_nequi?: string;
    pago_daviplata?: string;
    pago_cuenta_bancaria?: string;
  };
};

export type PagoTurnoInfo = {
  pago_monto_esperado?: number | null;
  comprobante_url?: string | null;
  comprobante_subido_at?: string | null;
  pago_motivo_rechazo?: string | null;
  hold_expires_at?: string | null;
  pago_validado_at?: string | null;
  requiere_comprobante?: boolean;
  pendiente_validacion?: boolean;
};

export type TurnoEstado =
  | 'esperando_pago'
  | 'pendiente_validacion'
  | 'pendiente'
  | 'confirmado'
  | 'cancelado'
  | 'completado';

export type Turno = {
  id: number;
  uuid?: string;
  barberia_id: number;
  barbero_id: number;
  servicio_id: number;
  cliente_id: number;
  fecha: string;
  hora: string;
  estado: TurnoEstado;
  precio: number | string;
  barbero?: Pick<Barbero, 'id' | 'nombre'>;
  servicio?: Pick<Servicio, 'id' | 'nombre' | 'precio'>;
  cliente?: Cliente;
  whatsapp_url?: string | null;
} & PagoTurnoInfo;

type TurnoMutationResponse = {
  message: string;
  data: Turno;
};

type TurnoEstadoResponse = {
  message: string;
  data: Turno;
};

export type Barberia = {
  id: number;
  nombre: string;
  slug?: string;
  logo?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  estado_pago?: string;
  estado_sistema?: string;
  fecha_vencimiento?: string | null;
};

export type Subscription = {
  estado_sistema: string;
  estado_pago: string;
  fecha_vencimiento: string | null;
  dias_restantes: number | null;
  etiqueta_dias: string | null;
  bloqueado: boolean;
  en_gracia: boolean;
};

export type BarberoPerfil = {
  id: number;
  uuid: string;
  nombre: string;
  foto?: string | null;
  especialidad?: string | null;
  telefono?: string | null;
};

export type User = {
  id: number;
  name: string;
  email: string;
  rol: string;
  barberia_id: number | null;
  barberia?: Barberia | null;
  barbero?: BarberoPerfil | null;
};

export type CitaPublica = {
  uuid: string;
  estado: TurnoEstado;
  fecha: string;
  hora: string;
  precio: number;
  servicio: string;
  barbero: string;
  barberia: string;
  barberia_slug?: string;
  cliente: string;
  cliente_telefono?: string;
  confirmado_at?: string | null;
  validado_at?: string | null;
  cita_url: string;
  qr_payload: string;
} & PagoTurnoInfo;

export type QrAccion = 'confirmar' | 'completar' | 'cancelar';

export type ConsultarQrResponse = {
  message: string;
  data: CitaPublica;
  es_mio: boolean;
  acciones: QrAccion[];
};

export type ValidarQrResponse = {
  message: string;
  data: CitaPublica;
  acciones: QrAccion[];
  whatsapp_url?: string | null;
  whatsapp_mensaje?: string | null;
  cliente_telefono?: string | null;
  qr_url?: string | null;
  cita_tarjeta_url?: string | null;
};

export type ConfirmarTurnoResponse = {
  message: string;
  whatsapp_url: string | null;
  whatsapp_mensaje?: string | null;
  cliente_telefono?: string | null;
  cita_url: string;
  qr_url?: string | null;
  cita_tarjeta_url?: string | null;
  data: CitaPublica;
};

export type BarberoTurno = {
  id: number;
  uuid: string;
  fecha: string;
  hora: string;
  estado: TurnoEstado;
  precio: number;
  servicio?: string;
  cliente?: string;
  telefono?: string;
  confirmado_at?: string | null;
  validado_at?: string | null;
  cita_url: string;
  whatsapp_url?: string | null;
} & PagoTurnoInfo;

export type BarberiaMatriz = {
  id: number;
  slug?: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  admin_nombre?: string | null;
  admin_email?: string | null;
  fecha_vencimiento: string | null;
  estado_pago: string;
  estado_sistema: string;
  dias_restantes: number | null;
  etiqueta_dias: string | null;
  activa: boolean;
  qr_url?: string;
};

export type MatrizStats = {
  total_barberias: number;
  activas: number;
  en_gracia: number;
  bloqueadas: number;
  ingresos_totales: number;
  pagos_registrados?: number;
};

export type PagoBarberia = {
  id: number;
  barberia_id: number;
  barberia_nombre?: string;
  monto: number;
  fecha_pago: string;
  nueva_fecha_vencimiento: string | null;
  registrado_por: string | null;
};

export type MatrizEstadosResponse = {
  resumen: {
    activo: number;
    en_gracia: number;
    bloqueado: number;
    pagado: number;
    pendiente: number;
  };
  por_sistema: Record<string, BarberiaMatriz[]>;
  por_pago: Record<string, BarberiaMatriz[]>;
};

export type MatrizReportesResponse = {
  stats: MatrizStats;
  pagos_mes: number;
  ingresos_mes: number;
  ultimos_pagos: PagoBarberia[];
  proximas_vencer: BarberiaMatriz[];
  vencidas: BarberiaMatriz[];
  barberias: BarberiaMatriz[];
};

export type BarberoUser = {
  id: number;
  name: string;
  email: string;
  rol: string;
  barberia_id: number | null;
};

export type Barbero = {
  id: number;
  uuid: string;
  barberia_id: number;
  user_id: number;
  nombre: string;
  foto?: string | null;
  especialidad?: string | null;
  telefono?: string | null;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  user?: BarberoUser;
};

export type Servicio = {
  id: number;
  uuid: string;
  barberia_id: number;
  nombre: string;
  precio: number;
  duracion: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Producto = {
  id: number;
  barberia_id: number;
  nombre: string;
  descripcion?: string | null;
  stock: number;
  precio: number;
  imagen?: string | null;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
};

export type HorarioBarbero = {
  id?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

export type BloqueoBarbero = {
  id?: number;
  fecha: string;
  motivo?: string | null;
};

export type HorarioSyncPayload = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo?: boolean;
};

type BarberoMutationResponse = {
  message: string;
  data: Barbero;
};

type BarberoDeleteResponse = {
  message: string;
};

type ServicioMutationResponse = {
  message: string;
  data: Servicio;
};

type ServicioDeleteResponse = {
  message: string;
};

type ProductoMutationResponse = {
  message: string;
  data: Producto;
};

type ProductoDeleteResponse = {
  message: string;
};

type HorariosSyncResponse = {
  message: string;
  horarios: HorarioBarbero[];
};

type BloqueoMutationResponse = {
  message: string;
  bloqueo: BloqueoBarbero;
};

type PublicServiciosResponse = {
  barberia: string;
  servicios: Pick<Servicio, 'uuid' | 'nombre' | 'precio' | 'duracion'>[];
};

type PublicBarberosResponse = {
  barberia: string;
  barberos: { uuid: string; nombre: string; especialidad?: string | null; telefono?: string | null }[];
};

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: BodyInit | null;
  headers?: Record<string, string>;
};

type LoginResponse = { message: string; token: string; user: User };
type MeResponse = { user: User; subscription?: Subscription };

type ConfigGetResponse = { barberia: Barberia; landing: LandingConfig };
type ConfigUpdateResponse = { message: string; barberia: Barberia };
type ConfigLogoResponse = { message: string; barberia: Barberia };
type ConfigLandingUpdateResponse = { message: string; landing: LandingConfig };
type ConfigBannerResponse = { message: string; landing: LandingConfig };

type MatrizDashboardResponse = {
  stats: MatrizStats;
  barberias: BarberiaMatriz[];
};

type MatrizActionResponse = {
  message: string;
  barberia: BarberiaMatriz;
};

type MatrizRegistrarBarberiaResponse = {
  message: string;
  barberia: BarberiaMatriz;
};

type MatrizPagosResponse = {
  pagos: PagoBarberia[];
  total: number;
};

function getToken(): string | null {
  return localStorage.getItem('bn_token');
}

function setToken(token: string | null): void {
  if (token) localStorage.setItem('bn_token', token);
  else localStorage.removeItem('bn_token');
}

function getStoredUser(): User | null {
  const raw = localStorage.getItem('bn_user');
  return raw ? (JSON.parse(raw) as User) : null;
}

function setStoredUser(user: User | null): void {
  if (user) localStorage.setItem('bn_user', JSON.stringify(user));
  else localStorage.removeItem('bn_user');
}

function getStoredSubscription(): Subscription | null {
  const raw = localStorage.getItem('bn_subscription');
  return raw ? (JSON.parse(raw) as Subscription) : null;
}

function setStoredSubscription(sub: Subscription | null): void {
  if (sub) localStorage.setItem('bn_subscription', JSON.stringify(sub));
  else localStorage.removeItem('bn_subscription');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (typeof window !== 'undefined') {
    headers['X-Frontend-Origin'] = window.location.origin;
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    let message =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      'Error en la solicitud';

    const errors = data?.errors;
    if (errors && typeof errors === 'object') {
      const firstField = Object.values(errors as Record<string, string[]>)[0];
      if (Array.isArray(firstField) && firstField[0]) {
        message = firstField[0];
      }
    }

    const err = new Error(message) as Error & { code?: string; status?: number };
    err.code = typeof data?.code === 'string' ? data.code : undefined;
    err.status = response.status;
    throw err;
  }

  return data as T;
}

async function publicRequest<T>(path: string, apiKey: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-KEY': apiKey,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) || 'Error en la solicitud pública';
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  getStoredSubscription,
  setStoredSubscription,

  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request<MeResponse>('/auth/me');
  },

  getConfiguracion() {
    return request<ConfigGetResponse>('/configuracion');
  },

  updateConfiguracion(payload: {
    nombre?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
  }) {
    return request<ConfigUpdateResponse>('/configuracion', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);

    return request<ConfigLogoResponse>('/configuracion/logo', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  updateLandingConfig(payload: Partial<LandingConfig>) {
    return request<ConfigLandingUpdateResponse>('/configuracion/landing', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  uploadBanner(file: File) {
    const formData = new FormData();
    formData.append('banner', file);

    return request<ConfigBannerResponse>('/configuracion/banner', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  getGaleriaCortes() {
    return request<{ galeria: GaleriaCorte[]; max: number }>('/configuracion/galeria');
  },

  uploadGaleriaCorte(file: File, titulo?: string) {
    const formData = new FormData();
    formData.append('imagen', file);
    if (titulo) formData.append('titulo', titulo);

    return request<{ message: string; data: GaleriaCorte }>('/configuracion/galeria', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  deleteGaleriaCorte(id: number) {
    return request<{ message: string }>(`/configuracion/galeria/${id}`, {
      method: 'DELETE',
    });
  },

  getMatrizDashboard(params?: { estado_pago?: string; estado_sistema?: string }) {
    const search = new URLSearchParams();
    if (params?.estado_pago) search.set('estado_pago', params.estado_pago);
    if (params?.estado_sistema) search.set('estado_sistema', params.estado_sistema);
    const qs = search.toString();

    return request<MatrizDashboardResponse>(`/matriz/dashboard${qs ? `?${qs}` : ''}`);
  },

  getMatrizPagos(barberiaId?: number) {
    const qs = barberiaId ? `?barberia_id=${barberiaId}` : '';
    return request<MatrizPagosResponse>(`/matriz/pagos${qs}`);
  },

  getMatrizEstados() {
    return request<MatrizEstadosResponse>('/matriz/estados');
  },

  getMatrizReportes() {
    return request<MatrizReportesResponse>('/matriz/reportes');
  },

  matrizRegistrarBarberia(payload: {
    name: string;
    email: string;
    password: string;
    nombre_barberia?: string;
  }) {
    return request<MatrizRegistrarBarberiaResponse>('/matriz/barberias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  matrizRegistrarPago(barberiaId: number) {
    return request<MatrizActionResponse>(`/matriz/barberias/${barberiaId}/registrar-pago`, {
      method: 'POST',
    });
  },

  matrizBloquear(barberiaId: number) {
    return request<MatrizActionResponse>(`/matriz/barberias/${barberiaId}/bloquear`, {
      method: 'POST',
    });
  },

  matrizActivar(barberiaId: number) {
    return request<MatrizActionResponse>(`/matriz/barberias/${barberiaId}/activar`, {
      method: 'POST',
    });
  },

  getBarberiaPublica(id: number) {
    return request<{ id: number; slug: string; nombre: string; mensaje: string }>(
      `/public/barberia/${id}`,
    );
  },

  getLandingBySlug(slug: string) {
    return request<LandingPageData>(`/public/b/${slug}`);
  },

  getDisponibilidadBySlug(slug: string, barberoUuid: string, fecha: string) {
    const qs = new URLSearchParams({ fecha });
    return request<DisponibilidadResponse>(
      `/public/b/${slug}/barberos/${barberoUuid}/disponibilidad?${qs}`,
    );
  },

  reservarTurnoBySlug(
    slug: string,
    payload: {
      barbero_uuid: string;
      servicio_uuid: string;
      fecha: string;
      hora: string;
      nombre: string;
      telefono: string;
      email?: string;
      registrarme?: boolean;
    },
  ) {
    return request<ReservaPublicaResponse>(`/public/b/${slug}/turnos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  subirComprobanteTurno(slug: string, uuid: string, telefono: string, file: File) {
    const formData = new FormData();
    formData.append('telefono', telefono);
    formData.append('comprobante', file);

    return request<{
      message: string;
      whatsapp_barbero_url?: string | null;
      data: CitaPublica;
    }>(`/public/b/${slug}/turnos/${uuid}/comprobante`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  getPublicServicios(apiKey: string) {
    return publicRequest<PublicServiciosResponse>('/public/servicios', apiKey);
  },

  getPublicBarberos(apiKey: string) {
    return publicRequest<PublicBarberosResponse>('/public/barberos', apiKey);
  },

  getPublicDisponibilidad(apiKey: string, barberoUuid: string, fecha: string) {
    const qs = new URLSearchParams({ fecha });
    return publicRequest<DisponibilidadResponse>(
      `/public/barberos/${barberoUuid}/disponibilidad?${qs}`,
      apiKey,
    );
  },

  getServicios() {
    return request<Servicio[]>('/servicios');
  },

  getServicio(id: number) {
    return request<Servicio>(`/servicios/${id}`);
  },

  createServicio(payload: { nombre: string; precio: number; duracion: number }) {
    return request<ServicioMutationResponse>('/servicios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateServicio(
    id: number,
    payload: Partial<{ nombre: string; precio: number; duracion: number; estado: boolean }>,
  ) {
    return request<ServicioMutationResponse>(`/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteServicio(id: number) {
    return request<ServicioDeleteResponse>(`/servicios/${id}`, {
      method: 'DELETE',
    });
  },

  getProductos() {
    return request<Producto[]>('/productos');
  },

  createProducto(payload: {
    nombre: string;
    precio: number;
    stock?: number;
    descripcion?: string;
  }) {
    return request<ProductoMutationResponse>('/productos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProducto(
    id: number,
    payload: Partial<{
      nombre: string;
      precio: number;
      stock: number;
      descripcion: string;
      estado: boolean;
    }>,
  ) {
    return request<ProductoMutationResponse>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteProducto(id: number) {
    return request<ProductoDeleteResponse>(`/productos/${id}`, {
      method: 'DELETE',
    });
  },

  uploadProductoImagen(id: number, file: File) {
    const formData = new FormData();
    formData.append('imagen', file);
    return request<ProductoMutationResponse>(`/productos/${id}/imagen`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  uploadBarberoFoto(id: number, file: File) {
    const formData = new FormData();
    formData.append('foto', file);
    return request<BarberoMutationResponse>(`/barberos/${id}/foto`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  getBarberoHorarios(uuid: string) {
    return request<HorarioBarbero[]>(`/barberos/${uuid}/horarios`);
  },

  syncBarberoHorarios(uuid: string, horarios: HorarioSyncPayload[]) {
    return request<HorariosSyncResponse>(`/barberos/${uuid}/horarios`, {
      method: 'POST',
      body: JSON.stringify(horarios),
    });
  },

  deleteBarberoHorario(uuid: string, dia: number) {
    return request<{ message: string }>(`/barberos/${uuid}/horarios/${dia}`, {
      method: 'DELETE',
    });
  },

  getBarberoBloqueos(uuid: string) {
    return request<BloqueoBarbero[]>(`/barberos/${uuid}/bloqueos`);
  },

  createBarberoBloqueo(uuid: string, payload: { fecha: string; motivo?: string }) {
    return request<BloqueoMutationResponse>(`/barberos/${uuid}/bloqueos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteBarberoBloqueo(uuid: string, fecha: string) {
    return request<{ message: string }>(`/barberos/${uuid}/bloqueos/${fecha}`, {
      method: 'DELETE',
    });
  },

  getBarberos() {
    return request<Barbero[]>('/barberos');
  },

  getBarbero(id: number) {
    return request<Barbero>(`/barberos/${id}`);
  },

  createBarbero(payload: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    especialidad?: string;
  }) {
    return request<BarberoMutationResponse>('/barberos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBarbero(
    id: number,
    payload: {
      nombre: string;
      email: string;
      telefono?: string;
      especialidad?: string;
      estado: boolean;
    },
  ) {
    return request<BarberoMutationResponse>(`/barberos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteBarbero(id: number) {
    return request<BarberoDeleteResponse>(`/barberos/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminTurnos() {
    return request<Turno[]>('/admin/turnos');
  },

  getAdminTurno(id: number) {
    return request<Turno>(`/admin/turnos/${id}`);
  },

  createAdminTurno(payload: {
    cliente_id: number;
    barbero_id: number;
    servicio_id: number;
    fecha: string;
    hora: string;
    precio?: number;
  }) {
    return request<TurnoMutationResponse>('/admin/turnos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateAdminTurno(
    id: number,
    payload: Partial<{
      cliente_id: number;
      barbero_id: number;
      servicio_id: number;
      fecha: string;
      hora: string;
      estado: TurnoEstado;
      precio: number;
    }>,
  ) {
    return request<TurnoMutationResponse>(`/admin/turnos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  cancelAdminTurno(id: number) {
    return request<{ message: string }>(`/admin/turnos/${id}`, {
      method: 'DELETE',
    });
  },

  cambiarEstadoTurno(id: number, estado: TurnoEstado) {
    return request<TurnoEstadoResponse>(`/admin/turnos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  },

  getAdminClientes() {
    return request<ClienteAdmin[]>('/admin/clientes');
  },

  getReportes(params?: { desde?: string; hasta?: string }) {
    const qs = new URLSearchParams();
    if (params?.desde) qs.set('desde', params.desde);
    if (params?.hasta) qs.set('hasta', params.hasta);
    const q = qs.toString();
    return request<ReportesResponse>(`/reportes${q ? `?${q}` : ''}`);
  },

  getInventarioResumen() {
    return request<InventarioResumen>('/inventario/resumen');
  },

  getMovimientosInventario(params?: {
    tipo?: 'entrada' | 'salida';
    producto_id?: number;
    desde?: string;
    hasta?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.tipo) qs.set('tipo', params.tipo);
    if (params?.producto_id) qs.set('producto_id', String(params.producto_id));
    if (params?.desde) qs.set('desde', params.desde);
    if (params?.hasta) qs.set('hasta', params.hasta);
    const q = qs.toString();
    return request<MovimientoInventario[]>(`/inventario/movimientos${q ? `?${q}` : ''}`);
  },

  registrarMovimientoInventario(payload: {
    producto_id: number;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    descripcion?: string;
  }) {
    return request<{ message: string; data: MovimientoInventario }>('/inventario/movimientos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCitaPublica(uuid: string) {
    return request<CitaPublica>(`/public/cita/${uuid}`);
  },

  getBarberoPerfil() {
    return request<{ barbero: BarberoPerfil & { user?: { name: string; email: string } }; barberia: Barberia }>(
      '/barbero/perfil',
    );
  },

  updateBarberoPerfil(payload: { telefono?: string; especialidad?: string }) {
    return request<{ message: string; barbero: BarberoPerfil }>('/barbero/perfil', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getBarberoMisTurnos() {
    return request<{ turnos: BarberoTurno[] }>('/barbero/mis-turnos');
  },

  confirmarTurnoBarbero(id: number) {
    return request<ConfirmarTurnoResponse>(`/barbero/turnos/${id}/confirmar`, {
      method: 'POST',
    });
  },

  aprobarPagoBarbero(id: number) {
    return request<ConfirmarTurnoResponse>(`/barbero/turnos/${id}/aprobar-pago`, {
      method: 'POST',
    });
  },

  rechazarPagoBarbero(id: number, motivo: string) {
    return request<{ message: string; data: CitaPublica }>(`/barbero/turnos/${id}/rechazar-pago`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  confirmarTurnoAdmin(id: number) {
    return request<ConfirmarTurnoResponse>(`/admin/turnos/${id}/confirmar`, {
      method: 'POST',
    });
  },

  aprobarPagoAdmin(id: number) {
    return request<ConfirmarTurnoResponse>(`/admin/turnos/${id}/aprobar-pago`, {
      method: 'POST',
    });
  },

  rechazarPagoAdmin(id: number, motivo: string) {
    return request<{ message: string; data: CitaPublica }>(`/admin/turnos/${id}/rechazar-pago`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  consultarTurnoQr(codigo: string) {
    return request<ConsultarQrResponse>('/barbero/turnos/consultar-qr', {
      method: 'POST',
      body: JSON.stringify({ codigo: codigo.trim() }),
    });
  },

  validarTurnoQr(codigo: string, accion: QrAccion = 'completar') {
    return request<ValidarQrResponse>('/barbero/turnos/validar-qr', {
      method: 'POST',
      body: JSON.stringify({ codigo: codigo.trim(), accion }),
    });
  },
};
