from typing import Optional
from fastapi import HTTPException, status

from app.models.agency import Agency, SubscriptionPlan


class FeatureFlags:
    """
    Feature flag system for controlling access to features based on subscription plans
    
    This implements the SaaS tiered access control:
    - Basique: Fleet Management only
    - Standard: Fleet + Pricing + Contracts
    - Premium: Fleet + Pricing + Contracts + OCR Automation
    - Entreprise: All features including Yield Management
    """
    
    # Feature definitions
    FLEET_MANAGEMENT = "fleet_management"
    PRICING = "pricing"
    CONTRACTS = "contracts"
    OCR_AUTOMATION = "ocr_automation"
    YIELD_MANAGEMENT = "yield_management"
    
    # Feature mapping by subscription plan
    PLAN_FEATURES = {
        SubscriptionPlan.BASIQUE: [
            FLEET_MANAGEMENT,
        ],
        SubscriptionPlan.STANDARD: [
            FLEET_MANAGEMENT,
            PRICING,
            CONTRACTS,
        ],
        SubscriptionPlan.PREMIUM: [
            FLEET_MANAGEMENT,
            PRICING,
            CONTRACTS,
            OCR_AUTOMATION,
        ],
        SubscriptionPlan.ENTREPRISE: [
            FLEET_MANAGEMENT,
            PRICING,
            CONTRACTS,
            OCR_AUTOMATION,
            YIELD_MANAGEMENT,
        ],
    }
    
    @staticmethod
    def has_feature(agency: Optional[Agency], feature: str) -> bool:
        """
        Check if an agency has access to a specific feature
        """
        if agency is None:
            return False
        
        allowed_features = FeatureFlags.PLAN_FEATURES.get(agency.subscription_plan, [])
        return feature in allowed_features
    
    @staticmethod
    def require_feature(agency: Optional[Agency], feature: str):
        """
        Raise an exception if the agency doesn't have access to a feature
        """
        if not FeatureFlags.has_feature(agency, feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature}' is not available in your subscription plan. Please upgrade to access this feature."
            )
    
    @staticmethod
    def get_plan_features(plan: SubscriptionPlan) -> list[str]:
        """
        Get all features available for a subscription plan
        """
        return FeatureFlags.PLAN_FEATURES.get(plan, [])
    
    @staticmethod
    def get_required_plan(feature: str) -> Optional[SubscriptionPlan]:
        """
        Get the minimum subscription plan required for a feature
        """
        for plan, features in FeatureFlags.PLAN_FEATURES.items():
            if feature in features:
                return plan
        return None


def require_feature(feature: str):
    """
    Decorator/dependency to require a specific feature for an endpoint
    Usage: 
        @router.get("/", dependencies=[Depends(require_feature(FeatureFlags.PRICING))])
    """
    from fastapi import Depends
    from app.core.dependencies import get_current_tenant
    
    async def feature_checker(agency: Optional[Agency] = Depends(get_current_tenant)):
        FeatureFlags.require_feature(agency, feature)
        return agency
    
    return feature_checker
