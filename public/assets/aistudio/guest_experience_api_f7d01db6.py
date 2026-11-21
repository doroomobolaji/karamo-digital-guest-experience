{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "3a672fb6-97ae-4875-9d36-186758015d12",
   "metadata": {},
   "outputs": [],
   "source": [
    "# Powers pre-arrival reminders, retention prompts, and front-desk/concierge views for a reservation\n",
    "\n",
    "{\n",
    "  \"booking_id\": \"HTL-2026-00001\",\n",
    "  \"user_id\": \"USR-10814\",\n",
    "  \"booking_status\": \"Completed\",\n",
    "  \"payment_status\": \"Paid\",\n",
    "  \"stay_summary\": {\n",
    "    \"room_type\": \"Deluxe\",\n",
    "    \"room_id\": \"220\",\n",
    "    \"checkin_date\": \"2026-10-25\",\n",
    "    \"checkout_date\": \"2026-10-28\",\n",
    "    \"stay_nights\": 3,\n",
    "    \"guest_count\": 2,\n",
    "    \"lead_time_days\": 7.14\n",
    "  },\n",
    "  \"financials\": {\n",
    "    \"amount_per_night\": 55000,\n",
    "    \"total_amount\": 165000,\n",
    "    \"currency\": null,\n",
    "    \"payment_method\": \"Mobile Money\",\n",
    "    \"payment_reference\": \"PAY-USD-000001\"\n",
    "  },\n",
    "  \"risk\": {\n",
    "    \"cancellation_risk_score\": 0.42,\n",
    "    \"cancellation_risk_tier\": \"MEDIUM\",\n",
    "    \"model_version\": \"cancel_logreg_v0.1\",\n",
    "    \"is_directional_estimate\": true,\n",
    "    \"recommended_action\": \"SEND_PRE_ARRIVAL_CHECKIN_REMINDER\"\n",
    "  }\n",
    "}"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "b6f67322-d371-4eaa-a92a-3601b6e19354",
   "metadata": {},
   "outputs": [],
   "source": [
    "# Powers personalized home banners, room/amenity recommendations, and repeat-guest recognition:\n",
    "\n",
    "{\n",
    "  \"user_id\": \"USR-10814\",\n",
    "  \"is_repeat_guest\": true,\n",
    "  \"total_bookings\": 2,\n",
    "  \"segment\": {\n",
    "    \"segment_id\": 1,\n",
    "    \"segment_label\": \"SHORT_STAY_VALUE\",\n",
    "    \"preferred_room_type\": \"Deluxe\",\n",
    "    \"preferred_payment_method\": \"Mobile Money\",\n",
    "    \"avg_stay_nights\": 2.0,\n",
    "    \"avg_total_amount\": 110000\n",
    "  },\n",
    "  \"ui_personalization\": {\n",
    "    \"show_repeat_guest_badge\": true,\n",
    "    \"featured_offer_type\": \"FLEXIBLE_ADDON_OR_UPGRADE\"\n",
    "  }\n",
    "}"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "86d26c08-5172-4c3d-a090-2d7be88cf779",
   "metadata": {},
   "outputs": [],
   "source": [
    "#Powers admin/ops widgets monitoring payment and booking durations by payment_method\n",
    "\n",
    "{\n",
    "  \"as_of\": \"2026-11-20T17:13:00+01:00\",\n",
    "  \"methods\": [\n",
    "    {\n",
    "      \"payment_method\": \"Mobile Money\",\n",
    "      \"booking_count\": 30,\n",
    "      \"avg_booking_duration_min\": 24.5,\n",
    "      \"avg_payment_duration_min\": 6.4,\n",
    "      \"observed_cancellation_rate\": 0.1,\n",
    "      \"high_friction_flag\": false\n",
    "    }\n",
    "  ]\n",
    "}"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3 (ipykernel)",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.13.9"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
