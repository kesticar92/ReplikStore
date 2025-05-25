#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "ExampleSecurityWidget.generated.h"

UCLASS()
class MYPROJECT2_API UExampleSecurityWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintImplementableEvent, Category = "WebSocket")
    void OnSecurityAlertReceived(const FString& Message);

protected:
    virtual void NativeConstruct() override;
}; 