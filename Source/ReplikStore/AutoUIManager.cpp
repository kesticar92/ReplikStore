#include "AutoUIManager.h"
#include "WebSocketManager.h"
#include "ExampleSecurityWidget.h"
#include "ExampleInventoryWidget.h"
#include "ExampleCustomerWidget.h"
#include "ExampleLayoutWidget.h"
#include "Blueprint/UserWidget.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "EngineUtils.h"

AAutoUIManager::AAutoUIManager()
{
    PrimaryActorTick.bCanEverTick = false;
}

void AAutoUIManager::BeginPlay()
{
    Super::BeginPlay();
    // Crear y mostrar un widget de texto grande en pantalla
    if (APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0))
    {
        UUserWidget* TestWidget = NewObject<UUserWidget>(PC, UUserWidget::StaticClass());
        if (TestWidget)
        {
            TestWidget->AddToViewport();
            // Mostrar mensaje en pantalla
            GEngine->AddOnScreenDebugMessage(-1, 10.0f, FColor::Green, TEXT("[PRUEBA] UI ACTIVA - INTEGRACIÓN FUNCIONANDO"));
        }
    }
    InitWidgets();
    BindWebSocketEvents();
}

void AAutoUIManager::InitWidgets()
{
    if (APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0))
    {
        // Seguridad
        SecurityWidget = CreateWidget<UExampleSecurityWidget>(PC, UExampleSecurityWidget::StaticClass());
        if (SecurityWidget) SecurityWidget->AddToViewport(0);
        // Inventario
        InventoryWidget = CreateWidget<UExampleInventoryWidget>(PC, UExampleInventoryWidget::StaticClass());
        if (InventoryWidget) InventoryWidget->AddToViewport(1);
        // Clientes
        CustomerWidget = CreateWidget<UExampleCustomerWidget>(PC, UExampleCustomerWidget::StaticClass());
        if (CustomerWidget) CustomerWidget->AddToViewport(2);
        // Layout
        LayoutWidget = CreateWidget<UExampleLayoutWidget>(PC, UExampleLayoutWidget::StaticClass());
        if (LayoutWidget) LayoutWidget->AddToViewport(3);
    }
}

void AAutoUIManager::BindWebSocketEvents()
{
    // Buscar el WebSocketManager en el mundo
    for (TActorIterator<AWebSocketManager> It(GetWorld()); It; ++It)
    {
        WebSocketManager = *It;
        break;
    }
    if (!WebSocketManager) return;

    // Enlazar eventos
    if (SecurityWidget)
    {
        WebSocketManager->OnSecurityEvent.AddDynamic(SecurityWidget, &UExampleSecurityWidget::OnSecurityAlertReceived);
    }
    if (InventoryWidget)
    {
        WebSocketManager->OnInventoryEvent.AddDynamic(InventoryWidget, &UExampleInventoryWidget::OnInventoryEventReceived);
    }
    if (CustomerWidget)
    {
        WebSocketManager->OnCustomerEvent.AddDynamic(CustomerWidget, &UExampleCustomerWidget::OnCustomerEventReceived);
    }
    if (LayoutWidget)
    {
        WebSocketManager->OnLayoutEvent.AddDynamic(LayoutWidget, &UExampleLayoutWidget::OnLayoutEventReceived);
    }
} 
