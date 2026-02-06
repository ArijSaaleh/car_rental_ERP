import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface Booking {
  id: number;
  bookingNumber: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  customer?: {
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    brand: string;
    model: string;
    licensePlate: string;
  };
}

interface BookingCalendarProps {
  bookings: Booking[];
  onBookingClick?: (booking: Booking) => void;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

export default function BookingCalendar({ bookings, onBookingClick }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getBookingsForDate = (date: Date) => {
    // Format YYYY-MM-DD without timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return bookings.filter(booking => {
      // Extract date part only (YYYY-MM-DD) from booking dates
      const startDate = booking.startDate.split('T')[0];
      const endDate = booking.endDate.split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month's days
    const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <div key={`prev-${day}`} className="min-h-28 p-2 bg-slate-50 text-slate-400 border border-slate-200">
          <div className="text-sm font-medium">{day}</div>
        </div>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const dateBookings = getBookingsForDate(date);
      const isToday = date.getTime() === today.getTime();

      days.push(
        <div
          key={day}
          className={cn(
            "min-h-28 p-2 border border-slate-200 hover:bg-slate-50 transition-colors",
            isToday && "bg-blue-50 border-blue-300"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1",
            isToday && "text-blue-600 font-bold"
          )}>
            {day}
            {isToday && (
              <span className="ml-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                Aujourd'hui
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dateBookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                onClick={() => onBookingClick?.(booking)}
                className={cn(
                  "text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity border",
                  STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'
                )}
              >
                <div className="font-semibold truncate">
                  {booking.vehicle?.brand} {booking.vehicle?.model}
                </div>
                <div className="truncate text-[10px] opacity-90">
                  {booking.customer?.firstName} {booking.customer?.lastName}
                </div>
              </div>
            ))}
            {dateBookings.length > 3 && (
              <div className="text-[10px] text-slate-600 font-medium pl-1">
                +{dateBookings.length - 3} autre{dateBookings.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Next month's days to complete the grid
    const totalDays = firstDay + daysInMonth;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="min-h-28 p-2 bg-slate-50 text-slate-400 border border-slate-200">
          <div className="text-sm font-medium">{day}</div>
        </div>
      );
    }

    return days;
  };

  return (
    <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Calendrier des Réservations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="hover:bg-blue-50"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="hover:bg-blue-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-48 text-center font-semibold text-lg">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="hover:bg-blue-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Days header */}
        <div className="grid grid-cols-7 bg-slate-100 border-b">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-sm text-slate-700 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-50 border-t">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="text-sm font-semibold text-slate-700">Légende:</div>
            <Badge className={STATUS_COLORS.pending}>En attente</Badge>
            <Badge className={STATUS_COLORS.confirmed}>Confirmée</Badge>
            <Badge className={STATUS_COLORS.in_progress}>En cours</Badge>
            <Badge className={STATUS_COLORS.completed}>Terminée</Badge>
            <Badge className={STATUS_COLORS.cancelled}>Annulée</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
