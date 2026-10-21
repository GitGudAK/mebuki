import Capacitor

/// Bridge controller that registers Mebuki's own native plugins.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CloudKVPlugin())
    }
}
