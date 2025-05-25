#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "ExampleInventoryWidget.generated.h"

UCLASS()
class MYPROJECT2_API UExampleInventoryWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintImplementableEvent, Category = "WebSocket")
    void OnInventoryEventReceived(const FString& Message);
}; 