package com.lapidado.vendas;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;
import com.revenuecat.purchases.capacitor.PurchasesPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PurchasesPlugin.class);
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
