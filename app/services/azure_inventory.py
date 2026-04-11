from collections import Counter
from typing import Dict, List, Optional

from azure.identity import ClientSecretCredential
from azure.mgmt.resource import ResourceManagementClient, SubscriptionClient


def discover_azure_resources(
    tenant_id: str,
    client_id: str,
    client_secret: str,
    subscription_ids: Optional[List[str]] = None,
    max_resources_per_subscription: int = 2000,
) -> Dict[str, object]:
    allowed_subscriptions = set(subscription_ids or [])
    credential = ClientSecretCredential(
        tenant_id=tenant_id,
        client_id=client_id,
        client_secret=client_secret,
    )

    subscriptions_client = SubscriptionClient(credential)
    subscriptions = list(subscriptions_client.subscriptions.list())
    if allowed_subscriptions:
        subscriptions = [s for s in subscriptions if s.subscription_id in allowed_subscriptions]

    result_subscriptions = []
    warnings = []

    for subscription in subscriptions:
        subscription_id = str(subscription.subscription_id)
        subscription_name = str(subscription.display_name)
        type_counter: Counter[str] = Counter()
        sample_resources = []
        scanned_count = 0

        try:
            resource_client = ResourceManagementClient(credential, subscription_id)
            for resource in resource_client.resources.list():
                scanned_count += 1
                if resource.type:
                    type_counter[str(resource.type)] += 1

                if len(sample_resources) < 200:
                    sample_resources.append(
                        {
                            "id": resource.id,
                            "name": resource.name,
                            "type": resource.type,
                            "location": resource.location,
                            "resource_group": resource.id.split("/")[4] if resource.id and len(resource.id.split("/")) > 4 else None,
                        }
                    )

                if scanned_count >= max_resources_per_subscription:
                    break

            result_subscriptions.append(
                {
                    "subscription_id": subscription_id,
                    "subscription_name": subscription_name,
                    "scanned_resources": scanned_count,
                    "resource_types": [{"type": kind, "count": count} for kind, count in type_counter.most_common()],
                    "sample_resources": sample_resources,
                }
            )
        except Exception as exc:
            warnings.append(f"Failed subscription {subscription_id}: {exc}")

    return {
        "subscriptions_scanned": len(result_subscriptions),
        "subscriptions": result_subscriptions,
        "warnings": warnings,
    }
