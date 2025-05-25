#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "ExampleLayoutWidget.generated.h"

UCLASS()
class MYPROJECT2_API UExampleLayoutWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintImplementableEvent, Category = "WebSocket")
    void OnLayoutEventReceived(const FString& Message);
}; 