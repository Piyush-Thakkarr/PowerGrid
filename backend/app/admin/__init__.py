"""SQLAdmin dashboard — admin panel for managing users, consumption, tariffs."""

from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from app.config import get_settings
from app.models.user import User, UserProfile
from app.models.tariff import Discom, Tariff
from app.models.gamification import Achievement, Challenge


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        settings = get_settings()
        if form.get("username") == settings.admin_email and form.get("password") == settings.admin_password:
            request.session.update({"admin": True})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("admin", False)


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.name, User.provider, User.created_at]
    column_searchable_list = [User.email, User.name]
    column_sortable_list = [User.created_at, User.email]
    can_create = False
    can_delete = False
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"


class UserProfileAdmin(ModelView, model=UserProfile):
    column_list = [UserProfile.user_id, UserProfile.state, UserProfile.tariff_plan,
                   UserProfile.household_size, UserProfile.xp, UserProfile.level]
    column_searchable_list = [UserProfile.state]
    can_create = False
    name = "Profile"
    name_plural = "Profiles"
    icon = "fa-solid fa-id-card"


class DiscomAdmin(ModelView, model=Discom):
    column_list = [Discom.id, Discom.name, Discom.state, Discom.regulator,
                   Discom.has_tou, Discom.electricity_duty_pct]
    column_searchable_list = [Discom.name, Discom.state]
    name = "DISCOM"
    name_plural = "DISCOMs"
    icon = "fa-solid fa-building"


class TariffAdmin(ModelView, model=Tariff):
    column_list = [Tariff.id, Tariff.discom_id, Tariff.category,
                   Tariff.slab_start, Tariff.slab_end, Tariff.rate_per_unit, Tariff.fixed_charge]
    name = "Tariff"
    name_plural = "Tariffs"
    icon = "fa-solid fa-indian-rupee-sign"


class AchievementAdmin(ModelView, model=Achievement):
    column_list = [Achievement.id, Achievement.name, Achievement.description, Achievement.icon]
    name = "Achievement"
    name_plural = "Achievements"
    icon = "fa-solid fa-trophy"


class ChallengeAdmin(ModelView, model=Challenge):
    column_list = [Challenge.id, Challenge.name, Challenge.target, Challenge.unit,
                   Challenge.start_date, Challenge.end_date, Challenge.is_active]
    name = "Challenge"
    name_plural = "Challenges"
    icon = "fa-solid fa-flag"


def setup_admin(app, engine):
    auth_backend = AdminAuth(secret_key="powergrid-admin-secret-key")
    admin = Admin(app, engine, authentication_backend=auth_backend)
    admin.add_view(UserAdmin)
    admin.add_view(UserProfileAdmin)
    admin.add_view(DiscomAdmin)
    admin.add_view(TariffAdmin)
    admin.add_view(AchievementAdmin)
    admin.add_view(ChallengeAdmin)
