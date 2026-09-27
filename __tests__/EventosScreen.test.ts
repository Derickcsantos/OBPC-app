import { getGoogleCalendarUrl } from '../src/screens/EventosScreen';
import { Evento } from '../src/types';

const evento: Evento = {
  evento_id: 'evento-1',
  nome_evento: 'Reunião comercial',
  descricao_evento: 'Alinhamento do projeto',
  data_evento: '2026-09-25',
  hora_inicio: '14:00:00',
  endereco_evento: 'Online',
};

describe('getGoogleCalendarUrl', () => {
  it('gera um template do Google Calendar sem usar API da agenda', () => {
    const url = getGoogleCalendarUrl(evento);

    expect(url).toContain('https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE');
    expect(url).toContain('text=Reuni%C3%A3o%20comercial');
    expect(url).toContain('dates=20260925T140000%2F20260925T150000');
    expect(url).toContain('details=Alinhamento%20do%20projeto');
    expect(url).toContain('location=Online');
  });

  it('não cria link quando a data é inválida', () => {
    expect(getGoogleCalendarUrl({ ...evento, data_evento: 'invalida', hora_inicio: null })).toBeNull();
  });
});
