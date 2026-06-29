import { OrderStatus } from '@stores/domain';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Borrador',
  placed: 'Recibido',
  confirmed: 'Confirmado',
  picking: 'Preparando',
  on_route: 'En ruta',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};
