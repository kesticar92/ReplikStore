#include "ExampleSecurityWidget.h"
#include "Components/TextBlock.h"
// La lógica se implementa en Blueprints 

void UExampleSecurityWidget::NativeConstruct()
{
    Super::NativeConstruct();
    // Mostrar mensaje de prueba al iniciar
    OnSecurityAlertReceived(TEXT("[PRUEBA] ¡Conexión exitosa! Widget de seguridad activo."));
} 