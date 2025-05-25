#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "AutoUIManager.generated.h"

UCLASS()
class MYPROJECT2_API AAutoUIManager : public AActor
{
    GENERATED_BODY()

public:
    AAutoUIManager();

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    class UExampleSecurityWidget* SecurityWidget;
    UPROPERTY()
    class UExampleInventoryWidget* InventoryWidget;
    UPROPERTY()
    class UExampleCustomerWidget* CustomerWidget;
    UPROPERTY()
    class UExampleLayoutWidget* LayoutWidget;
    UPROPERTY()
    class AWebSocketManager* WebSocketManager;

    void InitWidgets();
    void BindWebSocketEvents();
}; 