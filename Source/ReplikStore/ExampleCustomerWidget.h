#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "ExampleCustomerWidget.generated.h"

UCLASS()
class MYPROJECT2_API UExampleCustomerWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintImplementableEvent, Category = "WebSocket")
    void OnCustomerEventReceived(const FString& Message);
}; 