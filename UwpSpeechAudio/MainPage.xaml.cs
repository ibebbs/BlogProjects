using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading.Tasks;
using System.Windows.Input;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.Media;
using Windows.Media.Audio;
using Windows.Media.Capture;
using Windows.Media.Core;
using Windows.Media.MediaProperties;
using Windows.Media.Playback;
using Windows.Media.Render;
using Windows.Media.SpeechSynthesis;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.Storage.Streams;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

// The Blank Page item template is documented at http://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x409

namespace UwpSpeechAudio
{    

    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainPage : Page, INotifyPropertyChanged
    {
        private readonly DelegateCommand _speakCommand;
        private string _text = "Testing";
        private AudioGraph _graph;
        private AudioDeviceOutputNode _outputNode;
        private AudioSpeechInputNode _speechInputNode;
        //private AudioWhiteNoiseInputNode _whiteNoiseInputNode;
        //private AudioSubmixNode _submixNode;

        public event PropertyChangedEventHandler PropertyChanged;

        public MainPage()
        {
            this.InitializeComponent();

            _speakCommand = new DelegateCommand(Speak);

            DataContext = this;
        }

        protected override async void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);

            // Two pops here on RPi3
            AudioGraphSettings settings = new AudioGraphSettings(AudioRenderCategory.Speech);

            CreateAudioGraphResult graphResult = await AudioGraph.CreateAsync(settings);

            if (graphResult.Status != AudioGraphCreationStatus.Success)
            {
                throw new InvalidOperationException(graphResult.Status.ToString());
            }

            _graph = graphResult.Graph;

            var outputNodeResult = await _graph.CreateDeviceOutputNodeAsync();

            if (outputNodeResult.Status != AudioDeviceNodeCreationStatus.Success)
            {
                throw new InvalidOperationException(outputNodeResult.Status.ToString());
            }

            _outputNode = outputNodeResult.DeviceOutputNode;
            //_outputNode.EffectDefinitions.ToArray().ForEach(ed => _outputNode.DisableEffectsByDefinition(ed));

            //_submixNode = _graph.CreateSubmixNode(_outputNode.EncodingProperties);
            //_submixNode.AddOutgoingConnection(_outputNode);

            _speechInputNode = await _graph.CreateSpeechInputNodeAsync(new SpeechSynthesizer(), "As input node");
            _speechInputNode.AddOutgoingConnection(_outputNode);
            _speechInputNode.Stop();
            
            //_whiteNoiseInputNode = await _graph.CreateWhiteNoiseInputNodeAsync();
            //_whiteNoiseInputNode.AddOutgoingConnection(_outputNode);
            //_whiteNoiseInputNode.OutgoingGain = 0.2;

            _outputNode.Start();

            // Additional pop here on RPi3
            _graph.Start();
        }
       
        private void NotifyPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        private void Speak()
        {
            using (var synth = new SpeechSynthesizer())
            {
                // Using static graph creation style
                _speechInputNode.Reset();
                _speechInputNode.Start();

                /*
                // Using dynamic graph creation style
                using (ISpeechSynthesizerAudioNode node = await synth.SynthesizeTextToAudioNodeAsync(_text, _graph))
                {
                    TaskCompletionSource<object> tcs = new TaskCompletionSource<object>();
                    node.SpeechCompleted += (s, e) => tcs.TrySetResult(s);
                    node.AddOutgoingConnection(_outputNode);
                    node.Start();
                        
                    await tcs.Task;
                }
                */
            }
        }

        public ICommand SpeakCommand
        {
            get { return _speakCommand; }
        }

        public string Text
        {
            get { return _text; }
            set
            {
                if (!string.Equals(value, _text, StringComparison.CurrentCulture))
                {
                    _text = value;
                    NotifyPropertyChanged();
                }
            }
        }
    }
}
