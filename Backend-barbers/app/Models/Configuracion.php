<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Configuracion extends Model
{
    public const CLAVE_COLOR_PRINCIPAL = 'color_principal';

    public const CLAVE_COLOR_SECUNDARIO = 'color_secundario';

    public const CLAVE_MENSAJE_BIENVENIDA = 'mensaje_bienvenida';

    public const CLAVE_DESCRIPCION = 'descripcion';

    public const CLAVE_WHATSAPP = 'whatsapp';

    public const CLAVE_BANNER = 'banner';

    public const CLAVE_FACEBOOK = 'facebook';

    public const CLAVE_INSTAGRAM = 'instagram';

    public const CLAVE_TIKTOK = 'tiktok';

    public const CLAVE_FOOTER_TEXTO = 'footer_texto';

    public const CLAVE_PAGO_MODO = 'pago_modo';

    public const CLAVE_PAGO_NEQUI = 'pago_nequi';

    public const CLAVE_PAGO_DAVIPLATA = 'pago_daviplata';

    public const CLAVE_PAGO_CUENTA = 'pago_cuenta_bancaria';

    public const CLAVE_PAGO_MONTO_ABONO = 'pago_monto_abono';

    public const CLAVE_PAGO_HOLD_MINUTOS = 'pago_hold_minutos';

    public const DEFAULTS = [
        self::CLAVE_COLOR_PRINCIPAL => '#6366f1',
        self::CLAVE_COLOR_SECUNDARIO => '#1e1b4b',
        self::CLAVE_MENSAJE_BIENVENIDA => 'Tu estilo, nuestra pasión. Reserva tu cita hoy.',
        self::CLAVE_DESCRIPCION => 'Somos una barbería moderna dedicada a ofrecerte la mejor experiencia en cortes, barba y cuidado personal.',
        self::CLAVE_WHATSAPP => '',
        self::CLAVE_BANNER => '',
        self::CLAVE_FACEBOOK => '',
        self::CLAVE_INSTAGRAM => '',
        self::CLAVE_TIKTOK => '',
        self::CLAVE_FOOTER_TEXTO => '',
        self::CLAVE_PAGO_MODO => 'sin_pago',
        self::CLAVE_PAGO_NEQUI => '',
        self::CLAVE_PAGO_DAVIPLATA => '',
        self::CLAVE_PAGO_CUENTA => '',
        self::CLAVE_PAGO_MONTO_ABONO => '10000',
        self::CLAVE_PAGO_HOLD_MINUTOS => '15',
    ];

    protected $table = 'configuraciones';

    protected $fillable = [
        'barberia_id',
        'clave',
        'valor',
    ];

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }
}
