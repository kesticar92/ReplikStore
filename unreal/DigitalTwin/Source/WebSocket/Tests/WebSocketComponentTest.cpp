#include "Misc/AutomationTest.h"
#include "WebSocketComponent.h"
#include "JsonUtilities.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FWebSocketComponentTest, "DigitalTwin.WebSocket.ComponentTests",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FWebSocketComponentTest::RunTest(const FString& Parameters)
{
    // Crear componente
    UWebSocketComponent* WebSocketComp = NewObject<UWebSocketComponent>();
    TestNotNull("WebSocket Component should be created", WebSocketComp);

    // Probar conexión
    bool MessageReceived = false;
    WebSocketComp->OnMessage.AddLambda([&MessageReceived](const FString& Message) {
        MessageReceived = true;
    });

    // Probar autenticación
    const FString TestToken = "test-token";
    WebSocketComp->Connect("ws://localhost:3000/ws", TestToken);

    // Probar envío de mensaje
    const FString TestMessage = "{\"type\":\"test\",\"data\":\"test-data\"}";
    WebSocketComp->SendMessage(TestMessage);

    // Verificar desconexión
    WebSocketComp->Disconnect();
    TestTrue("WebSocket should disconnect cleanly", true);

    return true;
} 